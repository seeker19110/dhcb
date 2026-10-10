// lessons/toan7c4.ts — Toán 7, Chương 4: Tam giác bằng nhau.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C4_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c4-b1',
    grade: '7',
    chapterNumber: 4,
    chapterTitle: 'Tam giác bằng nhau',
    lessonNumber: 1,
    title: 'Tổng các góc trong một tam giác',
    hook:
      'Bác thợ làm mái nhà ghép ba thanh gỗ thành một khung kèo tam giác. Bác đo hai góc ở chân mái rồi biết ngay góc ở đỉnh mà không cần đo. ' +
      'Bạn thử xé ba góc của một tờ giấy hình tam giác rồi xếp ba mảnh cạnh nhau: chúng ghép thành một đường thẳng. ' +
      'Bí mật đó là “tổng ba góc của tam giác bằng 180°”. Bài này giải thích vì sao và cách dùng nó.',
    theory:
      'ĐỊNH LÍ TỔNG BA GÓC\n' +
      'Tổng ba góc trong một tam giác bằng 180°: với tam giác ABC, ∠A + ∠B + ∠C = 180°.\n' +
      'Vì sao đúng? Qua đỉnh A kẻ đường thẳng xy song song với BC. Hai góc so le trong tạo bởi xy với AB và AC bằng ∠B và ∠C (vì xy // BC). ' +
      'Ba góc tại đỉnh A (góc x với AB, góc BAC, góc AC với y) ghép lại thành một góc bẹt 180°, nên ∠B + ∠A + ∠C = 180°.\n\n' +
      'HỆ QUẢ TRONG TAM GIÁC VUÔNG\n' +
      'Tam giác vuông có một góc 90° nên hai góc nhọn còn lại có tổng bằng 90° (hai góc phụ nhau). Một tam giác chỉ có nhiều nhất một góc vuông hoặc một góc tù.\n\n' +
      'GÓC NGOÀI CỦA TAM GIÁC\n' +
      'Góc kề bù với một góc của tam giác gọi là góc ngoài tại đỉnh đó. Góc ngoài tại C là góc kề bù với ∠ACB (kéo dài BC về phía C). ' +
      'Tính chất: góc ngoài của tam giác bằng tổng hai góc trong không kề với nó. Vì sao? Góc ngoài = 180° − ∠C, mà 180° − ∠C = ∠A + ∠B vì ∠A + ∠B + ∠C = 180°.\n\n' +
      'CÁCH DÙNG\n' +
      '— Biết hai góc thì tìm góc thứ ba bằng cách lấy 180° trừ đi tổng hai góc kia.\n' +
      '— Biết quan hệ giữa các góc (hơn kém nhau, gấp nhau) thì lập phương trình với tổng 180°.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm tổng ba góc là 360° hoặc 90° rồi trừ sai. Tổng ba góc của MỌI tam giác đều là 180°; chỉ riêng hai góc nhọn của tam giác vuông mới có tổng 90°.\n' +
      '— Nhầm góc ngoài với góc trong: góc ngoài bằng tổng hai góc trong KHÔNG kề, không phải tổng ba góc.\n' +
      '— Cho rằng tam giác có thể có hai góc vuông hoặc hai góc tù. Khi đó tổng đã ≥ 180° nên không thể có góc thứ ba.',
    workedExample: {
      problem:
        'Tam giác ABC có ∠A = 50°, góc B lớn hơn góc C là 20°. a) Tính ∠B và ∠C. b) Tính góc ngoài tại đỉnh C và kiểm tra với tính chất góc ngoài.',
      steps: [
        'Tổng ba góc bằng 180° nên ∠B + ∠C = 180° − 50° = 130°.',
        'Gọi ∠C = x thì ∠B = x + 20°. Ta có x + (x + 20°) = 130°, suy ra 2x = 110° và x = 55°. Vậy ∠C = 55°, ∠B = 75°.',
        'Góc ngoài tại C kề bù với ∠C nên bằng 180° − 55° = 125°.',
        'Kiểm tra: ∠A + ∠B = 50° + 75° = 125°, đúng bằng góc ngoài tại C.',
      ],
      answer: 'a) ∠B = 75°, ∠C = 55°. b) Góc ngoài tại C bằng 125°.',
    },
    checkQuestions: [
      {
        prompt: 'Tam giác ABC có ∠A = 65° và ∠B = 48°. Tính ∠C (đơn vị độ).',
        answer: { kind: 'numeric', value: 67 },
        explain:
          'Tổng ba góc bằng 180° nên ∠C = 180° − 65° − 48° = 67°. Lỗi hay gặp là lấy 90° trừ hai góc vì nhầm với tam giác vuông, hoặc cộng thay vì trừ.',
      },
      {
        prompt:
          'Mặt cắt của một mái nhà là tam giác có hai góc ở chân mái là 30° và 40°. Tính góc ở đỉnh mái (đơn vị độ).',
        answer: { kind: 'numeric', value: 110 },
        explain:
          'Góc ở đỉnh bằng 180° trừ tổng hai góc ở chân: 180° − 30° − 40° = 110°. Lỗi hay gặp là kết luận chỉ là 70° vì dừng lại ở bước cộng 30° + 40°.',
      },
      {
        prompt: 'Tam giác ABC có ∠A = 48° và ∠B = 57°. Tính góc ngoài tại đỉnh C (đơn vị độ).',
        answer: { kind: 'numeric', value: 105 },
        explain:
          'Góc ngoài tại C bằng tổng hai góc trong không kề nó: 48° + 57° = 105°. Lỗi hay gặp là lấy tổng ba góc hoặc quên rằng góc ngoài kề bù với ∠C nên đáp ∠C = 75°.',
      },
      {
        prompt: 'Bộ ba số đo nào có thể là ba góc của một tam giác?',
        choices: [
          { id: 'a', label: '70°, 60°, 50°' },
          { id: 'b', label: '90°, 50°, 50°' },
          { id: 'c', label: '100°, 45°, 45°' },
          { id: 'd', label: '120°, 40°, 30°' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Ba góc của tam giác phải có tổng đúng 180°: 70° + 60° + 50° = 180°. Ba bộ còn lại đều có tổng 190°, lỗi hay gặp là chỉ nhìn góc lớn nhất mà không cộng đủ ba số.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tổng ba góc trong một tam giác bằng bao nhiêu?',
        dap: '180°.',
      },
      {
        hoi: 'Hai góc nhọn của tam giác vuông có quan hệ gì?',
        dap: 'Phụ nhau, tức là tổng bằng 90°.',
      },
      {
        hoi: 'Góc ngoài của tam giác bằng gì?',
        dap: 'Bằng tổng hai góc trong không kề với nó (và kề bù với góc trong kề nó).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c4-b2',
    grade: '7',
    chapterNumber: 4,
    chapterTitle: 'Tam giác bằng nhau',
    lessonNumber: 2,
    title: 'Hai tam giác bằng nhau và ba trường hợp bằng nhau của tam giác',
    hook:
      'Nhà máy cắt hàng nghìn miếng thép tam giác để làm giàn cầu, miếng nào cũng phải giống hệt nhau. ' +
      'Người kiểm hàng không thể đo cả sáu số (ba cạnh, ba góc) của từng miếng. May mắn là chỉ cần đo VÀI số đúng cách là biết hai miếng có chồng khít không. ' +
      'Đó chính là ba trường hợp bằng nhau c.c.c, c.g.c, g.c.g của tam giác.',
    theory:
      'HAI TAM GIÁC BẰNG NHAU\n' +
      'Hai tam giác bằng nhau nếu có thể đặt chồng khít lên nhau: ba cạnh tương ứng bằng nhau và ba góc tương ứng bằng nhau. ' +
      'Ký hiệu ΔABC = ΔDEF, các đỉnh viết THEO THỨ TỰ tương ứng: A↔D, B↔E, C↔F, nên AB = DE, BC = EF, CA = FD, ∠A = ∠D, ∠B = ∠E, ∠C = ∠F. Hai tam giác bằng nhau thì có cùng chu vi.\n\n' +
      'BA TRƯỜNG HỢP BẰNG NHAU CỦA TAM GIÁC\n' +
      '— Cạnh – cạnh – cạnh (c.c.c): ba cạnh của tam giác này bằng ba cạnh của tam giác kia.\n' +
      '— Cạnh – góc – cạnh (c.g.c): hai cạnh và GÓC XEN GIỮA hai cạnh đó bằng nhau.\n' +
      '— Góc – cạnh – góc (g.c.g): hai góc và CẠNH KỀ hai góc đó bằng nhau.\n' +
      'Vì sao chỉ cần ba số? Khi đã cố định ba số đo như vậy thì chỉ vẽ được duy nhất một tam giác (đến mức xoay, lật), nên hai tam giác vẽ theo cùng ba số đo ấy chồng khít nhau.\n\n' +
      'TAM GIÁC VUÔNG\n' +
      'Hai tam giác vuông bằng nhau nếu có một trong các điều kiện:\n' +
      '— hai cạnh góc vuông bằng nhau (c.g.c vì góc xen giữa là góc vuông);\n' +
      '— một cạnh góc vuông và một góc nhọn kề cạnh ấy bằng nhau (g.c.g);\n' +
      '— cạnh huyền và một góc nhọn bằng nhau;\n' +
      '— cạnh huyền và một cạnh góc vuông bằng nhau.\n\n' +
      'CÁCH CHỨNG MINH HAI TAM GIÁC BẰNG NHAU\n' +
      'Chọn trường hợp phù hợp, chỉ ra từng cặp yếu tố bằng nhau kèm lý do (giả thiết, trung điểm, đối đỉnh, cạnh chung…), rồi kết luận và viết đỉnh đúng thứ tự tương ứng. Từ đó suy ra các cạnh, góc còn lại bằng nhau.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng “hai cạnh và một góc” khi góc KHÔNG xen giữa hai cạnh: chưa đủ để kết luận bằng nhau.\n' +
      '— Dùng “ba góc bằng nhau” (g.g.g): không đủ, vì hai tam giác có thể cùng hình dạng nhưng to nhỏ khác nhau.\n' +
      '— Viết sai thứ tự đỉnh khi ghi ΔABC = ΔDEF: các cặp cạnh, góc suy ra sẽ sai theo.',
    workedExample: {
      problem:
        'Cho tam giác ABC, M là trung điểm của BC. Trên tia đối của tia MA lấy điểm D sao cho MD = MA. Chứng minh ΔAMB = ΔDMC, từ đó suy ra AB = DC.',
      steps: [
        'MB = MC vì M là trung điểm của BC.',
        '∠AMB = ∠DMC vì hai góc đối đỉnh (MA và MD là hai tia đối nhau, MB và MC là hai tia đối nhau).',
        'MA = MD theo cách lấy điểm D.',
        'Xét hai tam giác AMB và DMC có MA = MD, ∠AMB = ∠DMC, MB = MC. Góc ∠AMB xen giữa hai cạnh MA, MB; góc ∠DMC xen giữa hai cạnh MD, MC. Vậy ΔAMB = ΔDMC (c.g.c).',
        'Hai tam giác bằng nhau thì các cạnh tương ứng bằng nhau. AB tương ứng với DC nên AB = DC.',
      ],
      answer: 'ΔAMB = ΔDMC (c.g.c), suy ra AB = DC.',
    },
    checkQuestions: [
      {
        prompt:
          'Thợ gò hai miếng tôn tam giác: cả hai đều có một cạnh dài 10 cm, và hai góc kề với cạnh đó lần lượt là 40° và 60°. Hai miếng tôn đó có chồng khít nhau theo trường hợp nào?',
        choices: [
          { id: 'a', label: 'Cạnh – cạnh – cạnh (c.c.c)' },
          { id: 'b', label: 'Cạnh – góc – cạnh (c.g.c)' },
          { id: 'c', label: 'Góc – cạnh – góc (g.c.g)' },
          { id: 'd', label: 'Không đủ điều kiện để kết luận' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Có hai góc và cạnh KỀ hai góc đó bằng nhau, đúng trường hợp g.c.g nên hai miếng bằng nhau. Lỗi hay gặp là chọn “không đủ” vì tưởng cần biết cả ba cạnh.',
      },
      {
        prompt:
          'Hai tam giác ABC và DEF có AB = DE, AC = DF và ∠B = ∠E (góc B đối diện cạnh AC). Có thể kết luận gì?',
        choices: [
          { id: 'a', label: 'Bằng nhau theo c.c.c' },
          { id: 'b', label: 'Bằng nhau theo c.g.c' },
          { id: 'c', label: 'Bằng nhau theo g.c.g' },
          { id: 'd', label: 'Chưa đủ điều kiện để kết luận hai tam giác bằng nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'Góc B không nằm xen giữa hai cạnh AB và AC (nó xen giữa AB và BC), nên không đúng c.g.c; hai cạnh và góc không xen giữa chưa đủ. Lỗi hay gặp là thấy “hai cạnh và một góc” rồi kết luận ngay.',
      },
      {
        prompt: 'Biết ΔABC = ΔMNP (A↔M, B↔N, C↔P), ∠A = 52° và ∠N = 61°. Tính ∠P (đơn vị độ).',
        answer: { kind: 'numeric', value: 67 },
        explain:
          'Do ΔABC = ΔMNP nên ∠B = ∠N = 61°. Trong tam giác ABC, ∠C = 180° − 52° − 61° = 67° và ∠P = ∠C = 67°. Lỗi hay gặp là ghép nhầm đỉnh (cho ∠P = ∠A) vì không đọc thứ tự đỉnh tương ứng.',
      },
      {
        prompt:
          'Hai tam giác vuông ABC (vuông tại A) và DEF (vuông tại D) có cạnh huyền BC = EF và ∠B = ∠E. Chúng bằng nhau theo trường hợp nào?',
        choices: [
          { id: 'a', label: 'Hai cạnh góc vuông' },
          { id: 'b', label: 'Cạnh huyền – góc nhọn' },
          { id: 'c', label: 'Cạnh huyền – cạnh góc vuông' },
          { id: 'd', label: 'Chưa đủ điều kiện để kết luận' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Hai tam giác vuông có cạnh huyền bằng nhau và một góc nhọn bằng nhau thì bằng nhau (vì góc nhọn còn lại cũng bằng nhau, rồi áp dụng g.c.g). Lỗi hay gặp là nghĩ cần thêm một cạnh góc vuông.',
      },
    ],
    srsCards: [
      {
        hoi: 'Ba trường hợp bằng nhau của tam giác?',
        dap: 'c.c.c (ba cạnh); c.g.c (hai cạnh và góc xen giữa); g.c.g (hai góc và cạnh kề).',
      },
      {
        hoi: 'Vì sao g.g.g không phải trường hợp bằng nhau?',
        dap: 'Ba góc bằng nhau chỉ cho cùng hình dạng, hai tam giác vẫn có thể to nhỏ khác nhau.',
      },
      {
        hoi: 'Các trường hợp bằng nhau của tam giác vuông?',
        dap: 'Hai cạnh góc vuông; cạnh góc vuông và góc nhọn kề; cạnh huyền và góc nhọn; cạnh huyền và cạnh góc vuông.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c4-b3',
    grade: '7',
    chapterNumber: 4,
    chapterTitle: 'Tam giác bằng nhau',
    lessonNumber: 3,
    title: 'Tam giác cân và đường trung trực của đoạn thẳng',
    hook:
      'Mái đình, mái nhà làng thường có hai mái dốc giống hệt nhau ở hai bên đòn nóc, nên mặt cắt của chúng là tam giác cân. ' +
      'Còn khi làng muốn đặt một chiếc cột đèn cách đều hai ngôi nhà, họ phải chọn đúng một vị trí đặc biệt trên “đường trung trực” của đoạn nối hai nhà. ' +
      'Bài này học tính chất của tam giác cân và đường trung trực.',
    theory:
      'TAM GIÁC CÂN\n' +
      'Tam giác có hai cạnh bằng nhau gọi là tam giác cân. Nếu AB = AC thì tam giác ABC cân tại A; A là đỉnh, BC là đáy, ∠B và ∠C là hai góc ở đáy.\n' +
      'Tính chất: trong tam giác cân, hai góc ở đáy bằng nhau. Ngược lại, tam giác có hai góc bằng nhau thì cân.\n' +
      'Vì sao đúng? Kẻ tia phân giác AD của góc A (D thuộc BC). Hai tam giác ABD và ACD có AB = AC, ∠BAD = ∠CAD, AD chung nên bằng nhau (c.g.c), suy ra ∠B = ∠C.\n' +
      'Hệ quả khi tam giác ABC cân tại A: ∠B = ∠C = (180° − ∠A) : 2. Tam giác đều (ba cạnh bằng nhau) có ba góc bằng nhau và mỗi góc bằng 60°.\n\n' +
      'ĐƯỜNG TRUNG TRỰC CỦA ĐOẠN THẲNG\n' +
      'Đường thẳng vuông góc với đoạn thẳng AB tại trung điểm của nó gọi là đường trung trực của AB. Cần ĐỦ hai điều kiện: vuông góc với AB và đi qua trung điểm của AB.\n' +
      'Tính chất: điểm nằm trên đường trung trực của AB thì cách đều hai đầu mút A và B (MA = MB). Ngược lại, điểm cách đều A và B thì nằm trên đường trung trực của AB.\n' +
      'Vì sao? Nếu M nằm trên trung trực, gọi I là trung điểm AB thì hai tam giác vuông MIA và MIB có MI chung, IA = IB nên bằng nhau (hai cạnh góc vuông), suy ra MA = MB.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm góc ở đáy với góc ở đỉnh. Hai góc bằng nhau là hai góc ở ĐÁY (đối diện hai cạnh bằng nhau).\n' +
      '— Cho rằng đường thẳng vuông góc với AB là trung trực. Phải đi qua trung điểm nữa.\n' +
      '— Cho rằng đường thẳng đi qua trung điểm AB là trung trực. Phải vuông góc nữa.',
    workedExample: {
      problem:
        'Tam giác ABC cân tại A. a) Biết ∠A = 40°, tính ∠B và ∠C. b) Nếu biết ∠B = 50° thì ∠A bằng bao nhiêu?',
      steps: [
        'Tam giác ABC cân tại A nên hai góc ở đáy bằng nhau: ∠B = ∠C.',
        'Ở câu a: ∠B + ∠C = 180° − 40° = 140°, mà ∠B = ∠C nên mỗi góc bằng 140° : 2 = 70°.',
        'Ở câu b: ∠B = 50° nên ∠C = 50° (hai góc ở đáy). Suy ra ∠A = 180° − 50° − 50° = 80°.',
      ],
      answer: 'a) ∠B = ∠C = 70°. b) ∠A = 80°.',
    },
    checkQuestions: [
      {
        prompt: 'Tam giác ABC cân tại A có ∠A = 100°. Tính ∠B (đơn vị độ).',
        answer: { kind: 'numeric', value: 40 },
        explain:
          'Hai góc ở đáy bằng nhau và có tổng 180° − 100° = 80°, nên mỗi góc là 40°. Lỗi hay gặp là đáp 80° vì quên chia đôi, hoặc đáp 100° vì nhầm góc ở đỉnh với góc ở đáy.',
      },
      {
        prompt: 'Một tam giác cân có góc ở đáy bằng 65°. Tính góc ở đỉnh (đơn vị độ).',
        answer: { kind: 'numeric', value: 50 },
        explain:
          'Hai góc ở đáy cùng bằng 65° nên góc ở đỉnh bằng 180° − 65° − 65° = 50°. Lỗi hay gặp là lấy 180° − 65° = 115° mà quên trừ thêm góc đáy thứ hai.',
      },
      {
        prompt:
          'Hai nhà A và B cách nhau 80 m. Cột đèn M đặt trên đường trung trực của đoạn AB và cách nhà A 50 m. Cột đèn cách nhà B bao nhiêu mét?',
        answer: { kind: 'numeric', value: 50 },
        explain:
          'Điểm trên đường trung trực của AB cách đều hai đầu mút, nên MB = MA = 50 m. Lỗi hay gặp là lấy 80 − 50 = 30 vì tưởng cột đèn nằm trên đoạn AB.',
      },
      {
        prompt: 'Đường thẳng d là đường trung trực của đoạn thẳng AB khi nào?',
        choices: [
          { id: 'a', label: 'd đi qua trung điểm của AB nhưng không nhất thiết vuông góc với AB.' },
          { id: 'b', label: 'd vuông góc với AB nhưng không nhất thiết đi qua trung điểm.' },
          { id: 'c', label: 'd vuông góc với AB tại trung điểm của AB.' },
          { id: 'd', label: 'd song song với AB và cách đều hai đầu A, B.' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Theo định nghĩa, trung trực phải vuông góc với đoạn thẳng VÀ đi qua trung điểm; thiếu một trong hai điều kiện thì chưa phải. Lỗi hay gặp là chọn a hoặc b vì chỉ nhớ một điều kiện.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tính chất hai góc ở đáy của tam giác cân?',
        dap: 'Hai góc ở đáy bằng nhau; ngược lại, tam giác có hai góc bằng nhau thì cân.',
      },
      {
        hoi: 'Đường trung trực của đoạn thẳng AB là gì?',
        dap: 'Đường thẳng vuông góc với AB tại trung điểm của AB.',
      },
      {
        hoi: 'Tính chất điểm nằm trên đường trung trực?',
        dap: 'Điểm nằm trên trung trực của AB cách đều A và B; điểm cách đều A và B thì nằm trên trung trực của AB.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
