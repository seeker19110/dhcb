// lessons/toan6c8.ts — Toán 6, Chương 8: Những hình hình học cơ bản.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C8_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c8-b1',
    grade: '6',
    chapterNumber: 8,
    chapterTitle: 'Những hình hình học cơ bản',
    lessonNumber: 1,
    title: 'Điểm, đường thẳng và tia',
    hook:
      'Ba bạn đứng xếp hàng chào cờ: nhìn từ đầu hàng, bạn thứ hai che khuất bạn thứ ba thì ba bạn đang “thẳng hàng”. ' +
      'Thợ nề căng dây để xây tường thẳng, bạn kẻ vạch sân bóng bằng một sợi dây căng giữa hai cọc. ' +
      'Những ý tưởng quen thuộc ấy chính là điểm, đường thẳng, tia. Bài này đặt tên và quy ước cho chúng để dùng chính xác trong toán học.',
    theory:
      'ĐIỂM VÀ ĐƯỜNG THẲNG\n' +
      '— Điểm là hình đơn giản nhất, không có kích thước; ta vẽ bằng một chấm nhỏ và đặt tên bằng chữ cái in hoa: A, B, C…\n' +
      '— Đường thẳng kéo dài mãi về hai phía, không có đầu mút; đặt tên bằng chữ thường (a, d, m) hoặc bằng hai điểm trên nó (đường thẳng AB).\n' +
      '— Điểm A nằm trên đường thẳng d thì viết A ∈ d (A thuộc d). Điểm A không nằm trên d thì viết A ∉ d.\n' +
      'Quy tắc nền tảng: qua hai điểm phân biệt A và B có MỘT và chỉ một đường thẳng. Vì thế ta hay nói “đường thẳng AB”. ' +
      'Đây là lý do thợ nề chỉ cần hai cọc là kéo được sợi dây thẳng.\n\n' +
      'BA ĐIỂM THẲNG HÀNG\n' +
      'Ba điểm cùng nằm trên một đường thẳng gọi là ba điểm thẳng hàng. Nếu không có đường thẳng nào đi qua cả ba, chúng không thẳng hàng. ' +
      'Chú ý đến số đường thẳng: ba điểm thẳng hàng chỉ tạo ra 1 đường thẳng; ba điểm không thẳng hàng tạo ra 3 đường thẳng (qua từng cặp điểm).\n\n' +
      'ĐIỂM NẰM GIỮA\n' +
      'Khi ba điểm A, B, C thẳng hàng và B ở vị trí “giữa” A và C (đi từ A đến C phải đi qua B) thì ta nói B nằm giữa A và C. ' +
      'Chỉ nói “nằm giữa” khi ba điểm đã thẳng hàng.\n\n' +
      'TIA\n' +
      'Lấy điểm O trên đường thẳng xy. Điểm O chia đường thẳng thành hai nửa; mỗi nửa cùng với O gọi là một tia gốc O. ' +
      'Tia Ox bắt đầu từ O, kéo dài mãi về phía x. Tia có một đầu (gốc O) và không có đầu kia.\n' +
      '— Hai tia chung gốc và cùng nằm trên một đường thẳng, nhưng đi về hai phía ngược nhau, gọi là hai tia đối nhau. ' +
      'Ví dụ tia Ox và tia Oy đối nhau; chúng tạo thành cả đường thẳng xy.\n' +
      '— Hai tia chung gốc và cùng đi về một phía thì trùng nhau. Nếu B nằm giữa A và C thì tia AB và tia AC trùng nhau (cùng gốc A, cùng về phía C).\n' +
      '— Nếu O nằm giữa hai điểm A và B thì tia OA và tia OB là hai tia đối nhau.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng đường thẳng có hai đầu giống đoạn thẳng. Đường thẳng không có đầu; tia có một đầu.\n' +
      '— Coi hai tia cùng nằm trên một đường thẳng là hai tia đối nhau. Phải chung gốc và về hai phía ngược nhau.\n' +
      '— Tưởng đường thẳng AB khác đường thẳng BA. Đó là một đường thẳng, nhưng tia AB khác tia BA (khác gốc).',
    workedExample: {
      problem:
        'Trên một đường thẳng lấy ba điểm A, B, C sao cho B nằm giữa A và C. a) Kể tên hai tia đối nhau có gốc B. b) Tia AB và tia AC có quan hệ gì? c) Có bao nhiêu đường thẳng đi qua cả ba điểm?',
      steps: [
        'B nằm giữa A và C nên tia BA và tia BC chung gốc B và đi về hai phía ngược nhau. Hai tia đối nhau là BA và BC.',
        'Tia AB và tia AC cùng gốc A và cùng đi về phía B, C (vì B nằm giữa nên B và C cùng phía đối với A). Vậy hai tia này trùng nhau.',
        'Ba điểm thẳng hàng nên chỉ có đúng 1 đường thẳng đi qua cả ba điểm.',
      ],
      answer: 'a) BA và BC. b) Trùng nhau. c) Một đường thẳng.',
    },
    checkQuestions: [
      {
        prompt:
          'Cho ba điểm thẳng hàng M, N, P với N nằm giữa M và P. Hai tia nào sau đây là hai tia đối nhau?',
        choices: [
          { id: 'a', label: 'Tia NM và tia NP' },
          { id: 'b', label: 'Tia MN và tia MP' },
          { id: 'c', label: 'Tia PM và tia PN' },
          { id: 'd', label: 'Tia MN và tia NP' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hai tia NM và NP chung gốc N và đi về hai phía ngược nhau nên đối nhau. Tia MN và MP thì cùng gốc M, cùng phía nên trùng nhau; lỗi hay gặp là chọn cặp không chung gốc.',
      },
      {
        prompt:
          'Ba cây cột A, B, C trên sân không thẳng hàng. Người ta căng một sợi dây thẳng qua mỗi cặp cột. Cần tất cả bao nhiêu sợi dây?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Qua mỗi cặp điểm có một đường thẳng, ba điểm không thẳng hàng có ba cặp (AB, BC, CA) nên cần 3 sợi dây. Lỗi hay gặp là cho rằng chỉ cần 1 sợi vì nhầm với trường hợp ba điểm thẳng hàng.',
      },
      {
        prompt: 'Điểm O nằm trên đường thẳng d. Điểm O chia đường thẳng d thành mấy tia (gốc O)?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Mỗi điểm trên đường thẳng chia nó thành hai tia đối nhau có chung gốc O. Lỗi hay gặp là đáp 1 tia vì chỉ nhìn một phía của điểm O.',
      },
      {
        prompt: 'Cho đường thẳng d và điểm A không nằm trên d. Cách viết nào đúng?',
        choices: [
          { id: 'a', label: 'A ∈ d' },
          { id: 'b', label: 'A ∉ d' },
          { id: 'c', label: 'A = d' },
          { id: 'd', label: 'd ∈ A' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Ký hiệu ∉ nghĩa là “không thuộc”, nên A ∉ d. Điểm với đường thẳng là hai loại hình khác nhau nên không viết dấu bằng; lỗi hay gặp là đảo thứ tự viết d ∈ A.',
      },
    ],
    srsCards: [
      {
        hoi: 'Qua hai điểm phân biệt có bao nhiêu đường thẳng?',
        dap: 'Có một và chỉ một đường thẳng đi qua hai điểm phân biệt.',
      },
      {
        hoi: 'Hai tia đối nhau là hai tia thế nào?',
        dap: 'Chung gốc và nằm trên cùng một đường thẳng, đi về hai phía ngược nhau (tạo thành cả đường thẳng).',
      },
      {
        hoi: 'Khi nào nói điểm B nằm giữa hai điểm A và C?',
        dap: 'Khi A, B, C thẳng hàng và B ở vị trí giữa A và C.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c8-b2',
    grade: '6',
    chapterNumber: 8,
    chapterTitle: 'Những hình hình học cơ bản',
    lessonNumber: 2,
    title: 'Đoạn thẳng, độ dài đoạn thẳng và trung điểm',
    hook:
      'Bạn đo chiều dài chiếc bàn học bằng thước kẻ: đặt vạch 0 ở một mép, đọc số ở mép bên kia. Bác thợ mộc muốn khoan lỗ đúng giữa thanh gỗ ' +
      'nên đánh dấu điểm cách đều hai đầu. Hai việc đó chính là “độ dài đoạn thẳng” và “trung điểm”. Bài này giúp bạn tính độ dài và tìm điểm giữa chính xác.',
    theory:
      'ĐOẠN THẲNG\n' +
      'Đoạn thẳng AB gồm hai điểm A, B (hai đầu mút) và tất cả các điểm nằm giữa A và B. Khác với đường thẳng và tia, đoạn thẳng có hai đầu nên đo được độ dài. ' +
      'Độ dài đoạn thẳng AB, viết AB, là một số dương đo bằng một đơn vị (cm, m…). Hai điểm trùng nhau thì khoảng cách bằng 0.\n' +
      'Hai đoạn thẳng bằng nhau khi có cùng độ dài; đoạn nào có độ dài lớn hơn thì dài hơn.\n\n' +
      'CÁCH ĐO\n' +
      'Đặt vạch 0 của thước trùng điểm A, thước dọc theo đoạn AB, đọc số ở điểm B. Đừng bắt đầu từ vạch 1 mà quên trừ.\n\n' +
      'ĐIỂM NẰM GIỮA VÀ CỘNG ĐOẠN THẲNG\n' +
      'Nếu M nằm giữa A và B thì AM + MB = AB.\n' +
      'Hệ quả ngược lại cũng đúng: nếu ba điểm thẳng hàng và AM + MB = AB thì M nằm giữa A và B. ' +
      'Vì sao đúng? Đi dọc đoạn thẳng từ A đến B và ghé qua M thì quãng đường đúng bằng AM cộng MB.\n\n' +
      'Trên tia Ox, nếu lấy A và B sao cho OA < OB thì A nằm giữa O và B, và AB = OB − OA.\n\n' +
      'TRUNG ĐIỂM CỦA ĐOẠN THẲNG\n' +
      'Điểm M gọi là trung điểm của đoạn AB nếu M nằm giữa A và B VÀ MA = MB. Khi đó MA = MB = AB / 2.\n' +
      'Cả hai điều kiện đều cần. Điều kiện “nằm giữa” bị bỏ qua là lỗi rất hay gặp: điểm M cách đều A và B nhưng không nằm trên đường thẳng AB thì không là trung điểm.\n\n' +
      'ỨNG DỤNG\n' +
      'Cắt thanh gỗ dài 1,8 m tại trung điểm thì mỗi đoạn dài 0,9 m. Biết tổng và các phần, ta dùng AM + MB = AB để tìm phần còn lại.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cộng độ dài khi chưa kiểm tra điểm nằm giữa. Chỉ khi M nằm giữa A và B mới có AM + MB = AB.\n' +
      '— Chỉ dùng điều kiện MA = MB mà quên điều kiện M nằm giữa A và B.\n' +
      '— Quên đơn vị đo hoặc đo từ vạch 1 thay vì vạch 0.',
    workedExample: {
      problem:
        'Đoạn thẳng AB dài 10 cm. Điểm C nằm giữa A và B với AC = 4 cm. Gọi D là trung điểm của AB. Tính CB, AD và CD.',
      steps: [
        'C nằm giữa A và B nên AC + CB = AB. Do đó CB = AB − AC = 10 − 4 = 6 cm.',
        'D là trung điểm của AB nên AD = DB = AB : 2 = 10 : 2 = 5 cm.',
        'Trên tia AB, ta có AC = 4 cm < AD = 5 cm nên C nằm giữa A và D. Suy ra CD = AD − AC = 5 − 4 = 1 cm.',
      ],
      answer: 'CB = 6 cm; AD = 5 cm; CD = 1 cm.',
    },
    checkQuestions: [
      {
        prompt:
          'Ba điểm thẳng hàng A, B, C có AB = 2 cm, BC = 3 cm và AC = 5 cm. Điểm nào nằm giữa hai điểm còn lại?',
        choices: [
          { id: 'a', label: 'Điểm A' },
          { id: 'b', label: 'Điểm B' },
          { id: 'c', label: 'Điểm C' },
          { id: 'd', label: 'Không điểm nào' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Vì AB + BC = 2 + 3 = 5 = AC nên B nằm giữa A và C. Lỗi hay gặp là chọn điểm có số đo lớn nhất hoặc nhỏ nhất thay vì kiểm tra tổng hai đoạn có bằng đoạn còn lại không.',
      },
      {
        prompt:
          'Bác thợ cưa một thanh gỗ dài 1,8 m tại trung điểm của nó. Mỗi đoạn gỗ sau khi cưa dài bao nhiêu mét?',
        answer: { kind: 'numeric', value: 0.9 },
        explain:
          'Trung điểm chia thanh gỗ thành hai đoạn bằng nhau, mỗi đoạn dài 1,8 : 2 = 0,9 m. Lỗi hay gặp là nhân đôi (3,6 m) hoặc nhầm là 1,8 m vì quên chia hai.',
      },
      {
        prompt:
          'Trên tia Ox lấy hai điểm A và B với OA = 3 cm, OB = 7 cm. Tính độ dài AB (đơn vị cm).',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Trên cùng tia Ox có OA < OB nên A nằm giữa O và B, do đó AB = OB − OA = 7 − 3 = 4 cm. Lỗi hay gặp là cộng 3 + 7 = 10 cm vì tưởng A và B nằm hai phía của O.',
      },
      {
        prompt:
          'Điểm M thỏa mãn MA = MB = 2 cm nhưng ba điểm A, M, B KHÔNG thẳng hàng. Phát biểu nào đúng?',
        choices: [
          { id: 'a', label: 'M là trung điểm của AB' },
          { id: 'b', label: 'M không là trung điểm của AB vì M không nằm giữa A và B' },
          { id: 'c', label: 'AB = 4 cm' },
          { id: 'd', label: 'AB = 0 cm' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Trung điểm phải nằm giữa A và B và cách đều hai đầu; ở đây M không nằm trên đường thẳng AB nên không phải trung điểm. Lỗi hay gặp là chỉ dùng MA = MB rồi kết luận AB = 4 cm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nếu M nằm giữa A và B thì ta có hệ thức nào?',
        dap: 'AM + MB = AB.',
      },
      {
        hoi: 'Điều kiện để M là trung điểm của đoạn AB?',
        dap: 'M nằm giữa A và B và MA = MB (khi đó MA = MB = AB/2).',
      },
      {
        hoi: 'Trên tia Ox có OA < OB thì độ dài AB tính thế nào?',
        dap: 'A nằm giữa O và B, nên AB = OB − OA.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c8-b3',
    grade: '6',
    chapterNumber: 8,
    chapterTitle: 'Những hình hình học cơ bản',
    lessonNumber: 3,
    title: 'Góc và số đo góc',
    hook:
      'Hai kim đồng hồ lúc 3 giờ đúng tạo thành góc giống góc của quyển vở. Cánh cửa mở hé, mở rộng, mở hết đều tạo thành các góc to nhỏ khác nhau. ' +
      'Muốn nói góc nào “mở rộng hơn” một cách chính xác, ta dùng số đo bằng độ và dụng cụ là thước đo góc. Bài này dạy bạn nhận biết và đo góc.',
    theory:
      'GÓC LÀ GÌ\n' +
      'Hai tia Ox và Oy chung gốc O tạo thành một góc, kí hiệu góc xOy (hoặc góc yOx, góc O). ' +
      'Điểm O gọi là đỉnh của góc, hai tia Ox, Oy là hai cạnh của góc.\n\n' +
      'SỐ ĐO GÓC\n' +
      'Số đo góc cho biết góc “mở” rộng bao nhiêu, đơn vị là độ, kí hiệu °. Một vòng tròn đầy là 360°, nửa vòng là 180°. ' +
      'Mặt đồng hồ chia thành 12 phần bằng nhau nên mỗi giờ ứng với 360° : 12 = 30°.\n' +
      'Hai góc có cùng số đo thì bằng nhau; số đo lớn hơn thì góc lớn hơn.\n\n' +
      'DÙNG THƯỚC ĐO GÓC\n' +
      '1) Đặt tâm của thước trùng với đỉnh O của góc.\n' +
      '2) Đặt một cạnh của góc đi qua vạch 0 của thước.\n' +
      '3) Cạnh còn lại chỉ vào vạch nào thì đọc số đo ở vạch đó, trên đúng thang có vạch 0 nằm ở cạnh đầu tiên.\n' +
      'Thước có hai thang số ngược chiều nhau. Muốn khỏi đọc nhầm, hãy ước lượng bằng mắt trước: góc nhọn thì số đo nhỏ hơn 90, góc tù thì lớn hơn 90.\n\n' +
      'PHÂN LOẠI GÓC\n' +
      '— Góc nhọn: số đo lớn hơn 0° và nhỏ hơn 90°.\n' +
      '— Góc vuông: số đo bằng 90° (như góc quyển vở, góc bàn).\n' +
      '— Góc tù: số đo lớn hơn 90° và nhỏ hơn 180°.\n' +
      '— Góc bẹt: số đo bằng 180°; hai cạnh của nó là hai tia đối nhau, tạo thành một đường thẳng.\n\n' +
      'VÌ SAO LẠI LÀ 360°?\n' +
      'Người cổ đại chia vòng tròn thành 360 phần vì 360 chia hết cho rất nhiều số (2, 3, 4, 5, 6, 8, 9, 10, 12…), ' +
      'nên chia vòng tròn thành các phần đều thật tiện lợi.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đọc nhầm thang số của thước: góc nhọn mà đọc ra 130° là sai (phải ra 50°).\n' +
      '— Không đặt tâm thước đúng đỉnh hoặc cạnh góc không qua vạch 0 làm kết quả lệch.\n' +
      '— Cho rằng cạnh góc dài hơn thì góc lớn hơn. Số đo góc chỉ phụ thuộc độ mở, không phụ thuộc độ dài cạnh vẽ.',
    workedExample: {
      problem:
        'Lúc 5 giờ đúng, kim giờ chỉ số 5 và kim phút chỉ số 12 trên mặt đồng hồ. Tính số đo góc nhỏ hơn tạo bởi hai kim và cho biết đó là loại góc nào.',
      steps: [
        'Mặt đồng hồ là cả vòng 360° chia thành 12 phần bằng nhau, nên mỗi khoảng giữa hai số liền nhau ứng với 360° : 12 = 30°.',
        'Từ số 12 đến số 5 có 5 khoảng nên góc giữa hai kim là 5 · 30° = 150°.',
        'Phần còn lại của vòng là 360° − 150° = 210°, lớn hơn, nên góc nhỏ hơn là 150°.',
        'Vì 90° < 150° < 180° nên đây là góc tù.',
      ],
      answer: 'Góc nhỏ hơn bằng 150°, là góc tù.',
    },
    checkQuestions: [
      {
        prompt: 'Một góc có số đo 125°. Góc đó thuộc loại nào?',
        choices: [
          { id: 'a', label: 'Góc nhọn' },
          { id: 'b', label: 'Góc vuông' },
          { id: 'c', label: 'Góc tù' },
          { id: 'd', label: 'Góc bẹt' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Góc tù có số đo lớn hơn 90° và nhỏ hơn 180°; 125° nằm trong khoảng đó. Lỗi hay gặp là nhầm với góc bẹt (đúng 180°) chỉ vì số đo khá lớn.',
      },
      {
        prompt:
          'Lúc 4 giờ đúng, hai kim đồng hồ tạo thành góc nhỏ hơn có số đo bao nhiêu độ? (Mỗi giờ ứng với 30°.)',
        answer: { kind: 'numeric', value: 120 },
        explain:
          'Từ số 12 đến số 4 có 4 khoảng, mỗi khoảng 30°, nên góc là 4 · 30 = 120°, nhỏ hơn 180° nên đây là góc nhỏ hơn. Lỗi hay gặp là lấy 4 · 90 = 360° vì nhầm mỗi giờ với một góc vuông.',
      },
      {
        prompt:
          'Một chiếc quạt giấy được xòe hết cỡ thành nửa hình tròn. Góc giữa hai nan ngoài cùng của quạt bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 180 },
        explain:
          'Nửa hình tròn ứng với nửa vòng, tức 360° : 2 = 180°, đó là góc bẹt. Lỗi hay gặp là cho rằng quạt xòe hết cỡ chỉ tạo góc vuông 90°.',
      },
      {
        prompt:
          'Khi đo góc xOy, cạnh Ox đi qua vạch 0 của thang trong; cạnh Oy chỉ vào vạch 50 trên thang trong và vạch 130 trên thang ngoài. Số đo góc xOy là bao nhiêu?',
        choices: [
          { id: 'a', label: '50°' },
          { id: 'b', label: '130°' },
          { id: 'c', label: '180°' },
          { id: 'd', label: '80°' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Phải đọc trên thang có vạch 0 trùng cạnh Ox, đó là thang trong nên số đo là 50° (góc nhọn). Lỗi hay gặp là đọc nhầm thang ngoài, ra 130°.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân loại góc theo số đo?',
        dap: 'Nhọn: dưới 90°; vuông: 90°; tù: trên 90° và dưới 180°; bẹt: 180°.',
      },
      {
        hoi: 'Trên mặt đồng hồ, mỗi giờ ứng với góc bao nhiêu độ?',
        dap: '30°, vì 360° : 12 = 30°.',
      },
      {
        hoi: 'Nêu các bước đo góc bằng thước đo góc.',
        dap: 'Đặt tâm thước vào đỉnh, một cạnh qua vạch 0, đọc số ở cạnh còn lại trên thang có vạch 0 nằm ở cạnh đầu.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
