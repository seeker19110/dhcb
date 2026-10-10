// lessons/toan9c5.ts — Toán 9, Chương 5: Đường tròn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C5_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c5-b1',
    grade: '9',
    chapterNumber: 5,
    chapterTitle: 'Đường tròn',
    lessonNumber: 1,
    title: 'Đường tròn, cung và dây',
    hook:
      'Nắp cống ở sân trường em hình tròn, và nó không bao giờ rơi lọt xuống miệng cống. Một nắp hình vuông thì có thể lọt, nếu người ta xoay nó theo đường chéo. ' +
      'Lý do nằm ở một tính chất của đường tròn: đường kính là dây dài nhất. ' +
      'Bài này dạy em các khái niệm đầu tiên của chương: đường tròn, dây, đường kính, góc ở tâm và cung.',
    theory:
      'ĐƯỜNG TRÒN\n' +
      'Đường tròn tâm O bán kính R, kí hiệu (O; R), là tập hợp các điểm cách O một khoảng bằng R. Cho điểm M, ta so OM với R:\n' +
      '— OM = R: M nằm trên đường tròn.\n' +
      '— OM < R: M nằm bên trong đường tròn.\n' +
      '— OM > R: M nằm bên ngoài đường tròn.\n\n' +
      'DÂY VÀ ĐƯỜNG KÍNH\n' +
      'Dây là đoạn thẳng nối hai điểm bất kì của đường tròn. Đường kính là dây đi qua tâm, độ dài bằng 2R.\n' +
      'Định lí: trong các dây của đường tròn, đường kính là dây dài nhất.\n' +
      'VÌ SAO? Với dây AB, ta có OA = OB = R. Theo bất đẳng thức tam giác, AB ≤ OA + OB = 2R, dấu "=" xảy ra khi và chỉ khi O nằm trên AB, tức AB là đường kính.\n\n' +
      'ĐƯỜNG KÍNH VÀ DÂY\n' +
      'Định lí: đường kính vuông góc với một dây thì đi qua trung điểm của dây ấy. Ngược lại, đường kính đi qua trung điểm của một dây không đi qua tâm thì vuông góc với dây ấy.\n' +
      'VÌ SAO? Tam giác OAB cân tại O (OA = OB), nên đường cao OH đồng thời là đường trung tuyến, và ngược lại.\n' +
      'Nhờ vậy, gọi H là trung điểm dây AB thì OH vuông góc với AB và theo Pythagore: OA² = OH² + HA². OH chính là khoảng cách từ tâm O đến dây AB.\n\n' +
      'TÍNH ĐỐI XỨNG\n' +
      'Đường tròn có tâm đối xứng là tâm O. Mọi đường thẳng đi qua tâm (chứa một đường kính) đều là trục đối xứng của đường tròn, nên đường tròn có vô số trục đối xứng.\n\n' +
      'GÓC Ở TÂM VÀ CUNG\n' +
      'Góc ở tâm là góc có đỉnh trùng với tâm đường tròn. Hai điểm A, B trên đường tròn chia đường tròn thành hai cung. ' +
      'Khi góc ở tâm ∠AOB nhỏ hơn 180°, cung nằm bên trong góc là cung nhỏ AB, cung còn lại là cung lớn AB.\n' +
      '— Số đo cung nhỏ bằng số đo của góc ở tâm chắn cung đó.\n' +
      '— Số đo cung lớn bằng 360° trừ số đo cung nhỏ.\n' +
      '— Cả đường tròn có số đo 360°, mỗi nửa đường tròn có số đo 180°.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng cả độ dài dây 2a để tính Pythagore, quên rằng đường vuông góc hạ từ tâm chia dây làm đôi (phải dùng nửa dây).\n' +
      '— Nhầm cung nhỏ với cung lớn: cung nhỏ AB có số đo bằng góc AOB, cung lớn thì bằng 360° trừ số đó.\n' +
      '— Nhầm bán kính với đường kính khi đề cho "đường tròn đường kính 10 cm" (bán kính khi đó là 5 cm).',
    workedExample: {
      problem:
        'a) Cho đường tròn (O; 13 cm) và dây AB = 24 cm. Tính khoảng cách từ O đến AB. ' +
        'b) Trên một đường tròn khác, góc ở tâm ∠MON = 110°. Tìm số đo cung nhỏ MN và cung lớn MN.',
      steps: [
        'a) Gọi H là trung điểm của AB. Tam giác OAB cân tại O (OA = OB = 13) nên OH vuông góc với AB và HA = 24 : 2 = 12 cm.',
        'a) Tam giác OHA vuông tại H, theo Pythagore: OH² = OA² − HA² = 169 − 144 = 25, nên OH = 5 cm.',
        'b) Số đo cung nhỏ MN bằng số đo góc ở tâm ∠MON, tức 110°.',
        'b) Số đo cung lớn MN bằng 360° − 110° = 250°.',
      ],
      answer: 'a) 5 cm. b) Cung nhỏ MN là 110°, cung lớn MN là 250°.',
    },
    checkQuestions: [
      {
        prompt:
          'Đường tròn (O; 17 cm) có dây AB = 30 cm. Khoảng cách từ tâm O đến dây AB bằng bao nhiêu xentimét?',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'Gọi H là trung điểm của AB thì OH vuông góc với AB và HA = 15 cm. Theo Pythagore, OH² = 17² − 15² = 289 − 225 = 64, nên OH = 8 cm. ' +
          'Lỗi hay gặp là dùng cả dây 30 cm thay vì nửa dây 15 cm, khi đó 17² − 30² là số âm, vô lí.',
      },
      {
        prompt: 'Khẳng định nào sau đây về đường tròn là ĐÚNG?',
        choices: [
          { id: 'a', label: 'Mọi dây của đường tròn đều đi qua tâm' },
          { id: 'b', label: 'Có dây của đường tròn dài hơn đường kính' },
          { id: 'c', label: 'Đường kính là dây dài nhất của đường tròn' },
          { id: 'd', label: 'Đường tròn chỉ có đúng một trục đối xứng' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Với mọi dây AB, AB ≤ OA + OB = 2R, nên không dây nào dài hơn đường kính, đáp án c đúng. ' +
          'Đáp án a sai vì chỉ đường kính mới đi qua tâm, b sai theo bất đẳng thức tam giác, d sai vì mọi đường kính đều là trục đối xứng nên có vô số trục.',
      },
      {
        prompt: 'Cho góc ở tâm ∠AOB = 75°. Cung lớn AB có số đo bao nhiêu độ?',
        answer: { kind: 'numeric', value: 285 },
        explain:
          'Cung nhỏ AB có số đo bằng góc ở tâm, tức 75°. Cung lớn AB có số đo 360° − 75° = 285°. ' +
          'Lỗi hay gặp là trả lời 75° (đó là cung nhỏ) hoặc lấy 180° − 75° = 105° (nhầm 360° với 180°).',
      },
      {
        prompt:
          'Mặt đồng hồ treo tường có 12 vạch giờ cách đều nhau trên đường tròn tâm O. Cung nhỏ nối vạch 12 với vạch 5 có số đo bao nhiêu độ?',
        answer: { kind: 'numeric', value: 150 },
        explain:
          'Hai vạch liên tiếp cách nhau 360° : 12 = 30°. Từ vạch 12 đến vạch 5 có 5 khoảng nên cung có số đo 5 · 30° = 150°. Vì 150° < 180° nên đó đúng là cung nhỏ. ' +
          'Lỗi hay gặp là đếm theo chiều ngược lại (7 khoảng, được 210°), đó là số đo cung lớn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Điểm M nằm trong, trên, ngoài đường tròn (O; R) khi nào?',
        dap: 'Trong khi OM < R; trên khi OM = R; ngoài khi OM > R.',
      },
      {
        hoi: 'Đường kính vuông góc với dây thì có tính chất gì?',
        dap: 'Đi qua trung điểm của dây. Khi đó OH² + HA² = OA² (H là trung điểm dây AB), với OH là khoảng cách từ tâm đến dây.',
      },
      {
        hoi: 'Đường kính so với các dây khác của đường tròn?',
        dap: 'Đường kính là dây dài nhất, có độ dài 2R.',
      },
      {
        hoi: 'Cách tính số đo cung nhỏ và cung lớn AB?',
        dap: 'Cung nhỏ có số đo bằng góc ở tâm ∠AOB; cung lớn có số đo bằng 360° trừ số đo cung nhỏ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c5-b2',
    grade: '9',
    chapterNumber: 5,
    chapterTitle: 'Đường tròn',
    lessonNumber: 2,
    title: 'Độ dài cung tròn, diện tích hình quạt tròn và hình vành khuyên',
    hook:
      'Bác Hà làm một mảnh vườn hình quạt tròn: hai cạnh thẳng là hai bán kính, cạnh cong là một cung của đường tròn. ' +
      'Bác cần biết cạnh cong dài bao nhiêu mét để mua lưới rào, và mảnh vườn rộng bao nhiêu mét vuông để biết trồng được bao nhiêu luống rau. ' +
      'Bài này dạy em tính độ dài cung tròn, diện tích hình quạt tròn và diện tích hình vành khuyên.',
    theory:
      'ĐỘ DÀI CUNG TRÒN\n' +
      'Cả đường tròn bán kính R có chu vi 2πR, ứng với số đo 360°. Cung n° chiếm n/360 đường tròn, nên độ dài cung là:\n' +
      '   l = πRn/180\n' +
      'VÌ SAO có số 180? Vì l = 2πR · n/360 = πR · n/180, hai số 2 và 360 rút gọn cho nhau.\n\n' +
      'HÌNH QUẠT TRÒN\n' +
      'Hình quạt tròn là phần hình tròn giới hạn bởi hai bán kính và cung tròn nằm giữa hai bán kính đó. Hình quạt có góc ở tâm n° chiếm n/360 hình tròn, nên diện tích là:\n' +
      '   S = πR²n/360\n' +
      'Nếu đã biết độ dài cung l thì S = l · R/2 (giống như diện tích tam giác có đáy l và đường cao R, chia hai).\n\n' +
      'HÌNH VÀNH KHUYÊN\n' +
      'Hình vành khuyên là phần mặt phẳng nằm giữa hai đường tròn cùng tâm O, bán kính R và r (R > r). Diện tích bằng hình tròn lớn trừ hình tròn nhỏ:\n' +
      '   S = πR² − πr² = π(R² − r²)\n\n' +
      'LƯU Ý VỀ π\n' +
      'Đề bài thường yêu cầu "giữ nguyên π" (viết kết quả có chữ π, như 6π) hoặc "lấy π ≈ 3,14" (đổi ra số thập phân). Em làm theo đúng yêu cầu của đề.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm công thức độ dài cung (chia 180) với công thức diện tích hình quạt (chia 360).\n' +
      '— Quên bình phương bán kính khi tính diện tích, hoặc bình phương cả đường kính thay vì bán kính.\n' +
      '— Tính vành khuyên bằng π(R − r)² thay vì π(R² − r²): hai biểu thức này khác nhau.\n' +
      '— Quên đơn vị: độ dài cung tính bằng cm, diện tích tính bằng cm².',
    workedExample: {
      problem:
        'Cho đường tròn (O) có bán kính 6 cm. a) Tính độ dài cung 60° và diện tích hình quạt tròn ứng với cung đó. ' +
        'b) Một hình vành khuyên giới hạn bởi hai đường tròn cùng tâm bán kính 5 cm và 3 cm. Tính diện tích. Lấy π ≈ 3,14.',
      steps: [
        'a) Độ dài cung: l = π · 6 · 60/180 = 2π ≈ 2 · 3,14 = 6,28 cm.',
        'a) Diện tích hình quạt: S = π · 6² · 60/360 = π · 36/6 = 6π ≈ 6 · 3,14 = 18,84 cm².',
        'a) Kiểm tra bằng công thức S = l · R/2 = 2π · 6/2 = 6π, trùng kết quả.',
        'b) Diện tích vành khuyên: S = π(5² − 3²) = π(25 − 9) = 16π ≈ 16 · 3,14 = 50,24 cm².',
      ],
      answer: 'a) l = 2π ≈ 6,28 cm; S = 6π ≈ 18,84 cm². b) 16π ≈ 50,24 cm².',
    },
    checkQuestions: [
      {
        prompt: 'Cung 90° của đường tròn bán kính 8 cm có độ dài bằng kπ cm. Nhập số k.',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'l = π · 8 · 90/180 = 4π, nên k = 4. Cũng có thể lập luận: 90° là một phần tư đường tròn, chu vi 2π · 8 = 16π, một phần tư là 4π. ' +
          'Lỗi hay gặp là chia cho 360 thay vì 180 trong công thức độ dài cung, ra 2π.',
      },
      {
        prompt:
          'Trên đường tròn bán kính 12 cm, một cung có độ dài 5π cm. Số đo của cung đó bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 75 },
        explain:
          'Từ l = πRn/180 suy ra n = 180 · l/(πR) = 180 · 5π/(12π) = 900/12 = 75 độ. ' +
          'Lỗi hay gặp là dùng 360 thay vì 180 và ra 150°, hoặc quên rằng chữ π ở tử và ở mẫu rút gọn được cho nhau.',
      },
      {
        prompt:
          'Hình vành khuyên giới hạn bởi hai đường tròn cùng tâm có bán kính 7 cm và 4 cm. Diện tích hình vành khuyên là:',
        choices: [
          { id: 'a', label: '9π cm²' },
          { id: 'b', label: '65π cm²' },
          { id: 'c', label: '22π cm²' },
          { id: 'd', label: '33π cm²' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'S = π(R² − r²) = π(49 − 16) = 33π cm², đáp án d. ' +
          'Đáp án a là π(R − r)² = 9π, đáp án b là π(R² + r²) = 65π (cộng thay vì trừ), đáp án c là 2π(R + r) = 22π (lẫn với chu vi).',
      },
      {
        prompt:
          'Một chiếc bánh pizza hình tròn bán kính 15 cm. Cắt một miếng hình quạt tròn có góc ở tâm 40°. ' +
          'Lấy π ≈ 3,14 và làm tròn đến hàng phần mười: diện tích miếng bánh bằng bao nhiêu xentimét vuông?',
        answer: { kind: 'numeric', value: 78.5, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          'S = π · 15² · 40/360 = π · 225/9 = 25π ≈ 25 · 3,14 = 78,5 cm². ' +
          'Lỗi hay gặp là quên bình phương bán kính (π · 15 · 40/360 ≈ 5,2) hoặc dùng cả đường kính 30 cm làm bán kính, được kết quả gấp 4 lần.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức độ dài cung n° của đường tròn bán kính R?',
        dap: 'l = πRn/180.',
      },
      {
        hoi: 'Công thức diện tích hình quạt tròn bán kính R, góc ở tâm n°?',
        dap: 'S = πR²n/360, hoặc S = l · R/2 khi đã biết độ dài cung l.',
      },
      {
        hoi: 'Diện tích hình vành khuyên giữa hai đường tròn bán kính R và r (R > r)?',
        dap: 'S = π(R² − r²). Lưu ý: không phải π(R − r)².',
      },
      {
        hoi: 'Chu vi và diện tích cả đường tròn bán kính R?',
        dap: 'Chu vi 2πR (ứng 360°); diện tích hình tròn πR².',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c5-b3',
    grade: '9',
    chapterNumber: 5,
    chapterTitle: 'Đường tròn',
    lessonNumber: 3,
    title: 'Vị trí tương đối của đường thẳng và đường tròn, của hai đường tròn',
    hook:
      'Bánh xe đạp lăn trên mặt đường chỉ chạm đường tại đúng một điểm. Hai bánh răng của chiếc máy xay ăn khớp nhau cũng chạm nhau tại một điểm. ' +
      'Còn hai chiếc vòng tay xếp chồng lên nhau thì cắt nhau ở hai điểm. ' +
      'Bài này dạy em xác định các vị trí đó bằng một phép so sánh độ dài đơn giản, và nhận biết tiếp tuyến của đường tròn.',
    theory:
      'ĐƯỜNG THẲNG VÀ ĐƯỜNG TRÒN\n' +
      'Cho đường tròn (O; R) và đường thẳng a. Gọi d là khoảng cách từ O đến a. So d với R:\n' +
      '— d < R: a cắt đường tròn tại hai điểm phân biệt.\n' +
      '— d = R: a chỉ có đúng một điểm chung với đường tròn, ta nói a tiếp xúc với đường tròn. Khi đó a là tiếp tuyến, điểm chung là tiếp điểm.\n' +
      '— d > R: a không có điểm chung với đường tròn.\n\n' +
      'TIẾP TUYẾN\n' +
      'Tính chất: tiếp tuyến của đường tròn vuông góc với bán kính đi qua tiếp điểm.\n' +
      'Dấu hiệu nhận biết: đường thẳng đi qua một điểm của đường tròn và vuông góc với bán kính đi qua điểm đó thì là một tiếp tuyến của đường tròn.\n' +
      'Hệ quả: nếu MA là tiếp tuyến tại A của (O; R) thì tam giác OAM vuông tại A, nên MA² = OM² − R².\n\n' +
      'HAI TIẾP TUYẾN CẮT NHAU\n' +
      'Từ điểm M ở ngoài đường tròn (O) kẻ hai tiếp tuyến MA và MB (A, B là các tiếp điểm). Khi đó:\n' +
      '— MA = MB.\n' +
      '— MO là tia phân giác của góc AMB.\n' +
      '— OM là tia phân giác của góc AOB.\n' +
      'VÌ SAO MA = MB? Hai tam giác vuông OAM và OBM có chung cạnh huyền OM và OA = OB = R, nên bằng nhau (cạnh huyền, cạnh góc vuông), suy ra MA = MB và các góc tương ứng bằng nhau.\n\n' +
      'HAI ĐƯỜNG TRÒN\n' +
      "Cho (O; R) và (O'; r) với R > r, đặt OO' là khoảng cách giữa hai tâm:\n" +
      "— OO' > R + r: hai đường tròn ở ngoài nhau.\n" +
      "— OO' = R + r: tiếp xúc ngoài (một điểm chung).\n" +
      "— R − r < OO' < R + r: cắt nhau tại hai điểm.\n" +
      "— OO' = R − r: tiếp xúc trong (một điểm chung).\n" +
      "— OO' < R − r: đựng nhau (đường tròn nhỏ nằm trọn trong đường tròn lớn).\n" +
      "VÌ SAO? Khi hai đường tròn cắt nhau tại A thì O, O', A tạo thành một tam giác với OA = R, O'A = r, nên theo bất đẳng thức tam giác R − r < OO' < R + r.\n\n" +
      'LỖI HAY GẶP\n' +
      '— Nhầm "tiếp xúc ngoài" (OO\' = R + r) với "tiếp xúc trong" (OO\' = R − r).\n' +
      '— So d với đường kính thay vì với bán kính R.\n' +
      '— Quên rằng tiếp tuyến vuông góc với bán kính tại tiếp điểm, nên dùng sai Pythagore (lấy MA là cạnh huyền thay vì OM).',
    workedExample: {
      problem:
        'a) Từ điểm M cách tâm O một khoảng 13 cm, kẻ tiếp tuyến MA tới đường tròn (O; 5 cm) (A là tiếp điểm). Tính MA. ' +
        "b) Hai đường tròn (O; 7 cm) và (O'; 4 cm) có OO' = 10 cm. Xét vị trí tương đối của hai đường tròn. " +
        'c) Đường thẳng a cách tâm O một khoảng 3 cm. Xét vị trí của a với đường tròn (O; 5 cm).',
      steps: [
        'a) MA là tiếp tuyến nên OA vuông góc với MA tại A, tam giác OAM vuông tại A.',
        'a) Theo Pythagore: MA² = OM² − OA² = 169 − 25 = 144, nên MA = 12 cm.',
        'b) R = 7, r = 4 nên R + r = 11 và R − r = 3.',
        "b) Vì 3 < OO' = 10 < 11 nên hai đường tròn cắt nhau tại hai điểm.",
        'c) Khoảng cách từ O đến a là d = 3 cm, nhỏ hơn R = 5 cm, nên a cắt đường tròn tại hai điểm phân biệt.',
      ],
      answer: 'a) MA = 12 cm. b) Hai đường tròn cắt nhau. c) a cắt đường tròn tại hai điểm.',
    },
    checkQuestions: [
      {
        prompt:
          'Từ điểm M cách tâm O của đường tròn (O; 8 cm) một khoảng 17 cm, kẻ tiếp tuyến MA (A là tiếp điểm). Độ dài MA bằng bao nhiêu xentimét?',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'Tiếp tuyến MA vuông góc với bán kính OA, nên tam giác OAM vuông tại A và MA² = OM² − OA² = 289 − 64 = 225, suy ra MA = 15 cm. ' +
          'Lỗi hay gặp là coi MA là cạnh huyền và tính 17² + 8².',
      },
      {
        prompt:
          "Hai đường tròn (O; 6 cm) và (O'; 2 cm) có khoảng cách giữa hai tâm OO' = 4 cm. Vị trí tương đối của hai đường tròn là:",
        choices: [
          { id: 'a', label: 'Tiếp xúc ngoài' },
          { id: 'b', label: 'Tiếp xúc trong' },
          { id: 'c', label: 'Cắt nhau tại hai điểm' },
          { id: 'd', label: 'Ở ngoài nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          "Ta có R − r = 6 − 2 = 4 và OO' = 4, nên OO' = R − r: hai đường tròn tiếp xúc trong. " +
          "Tiếp xúc ngoài sẽ cần OO' = R + r = 8; cắt nhau cần 4 < OO' < 8; ở ngoài nhau cần OO' > 8.",
      },
      {
        prompt:
          'Từ điểm M ở ngoài đường tròn (O), kẻ hai tiếp tuyến MA và MB (A, B là các tiếp điểm). Biết góc ∠AOB = 130°. Số đo góc ∠AMB bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 50 },
        explain:
          'Tứ giác OAMB có ∠OAM = ∠OBM = 90° (tiếp tuyến vuông góc bán kính). Tổng bốn góc là 360°, nên ∠AMB = 360° − 90° − 90° − 130° = 50°. ' +
          'Lỗi hay gặp là quên hai góc vuông ở tiếp điểm, nên không tính được tổng 360°.',
      },
      {
        prompt:
          'Hai bánh răng hình tròn của một chiếc máy tiếp xúc ngoài với nhau. Bánh lớn có bán kính 12 cm và khoảng cách giữa hai tâm là 20 cm. Bánh nhỏ có bán kính bao nhiêu xentimét?',
        answer: { kind: 'numeric', value: 8 },
        explain:
          "Hai đường tròn tiếp xúc ngoài nên OO' = R + r, suy ra r = 20 − 12 = 8 cm. " +
          "Lỗi hay gặp là dùng công thức tiếp xúc trong OO' = R − r, khi đó r = 12 − 20 là số âm, vô lí.",
      },
    ],
    srsCards: [
      {
        hoi: 'Vị trí của đường thẳng a với đường tròn (O; R) theo khoảng cách d = d(O, a)?',
        dap: 'd < R: cắt tại hai điểm; d = R: tiếp xúc (a là tiếp tuyến); d > R: không có điểm chung.',
      },
      {
        hoi: 'Tiếp tuyến của đường tròn có tính chất gì? Dấu hiệu nhận biết?',
        dap: 'Tiếp tuyến vuông góc với bán kính tại tiếp điểm. Đường thẳng qua một điểm của đường tròn và vuông góc với bán kính tại điểm đó là tiếp tuyến.',
      },
      {
        hoi: 'Hai tiếp tuyến MA, MB cắt nhau tại M có tính chất gì?',
        dap: 'MA = MB; MO là phân giác của góc AMB; OM là phân giác của góc AOB.',
      },
      {
        hoi: "Vị trí hai đường tròn (O; R), (O'; r) với R > r theo OO'?",
        dap: "Ngoài nhau: OO' > R + r. Tiếp xúc ngoài: OO' = R + r. Cắt nhau: R − r < OO' < R + r. Tiếp xúc trong: OO' = R − r. Đựng nhau: OO' < R − r.",
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
