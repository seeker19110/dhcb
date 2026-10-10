// lessons/toan8c3.ts — Toán 8, Chương 3: Tứ giác.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C3_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c3-b1',
    grade: '8',
    chapterNumber: 3,
    chapterTitle: 'Tứ giác',
    lessonNumber: 1,
    title: 'Tứ giác và hình thang cân',
    hook:
      'Mặt cắt của một con kênh dẫn nước ngoài đồng có dạng một hình có hai bờ nghiêng đều nhau: đáy kênh ngắn, miệng kênh rộng hơn. ' +
      'Bác kỹ sư chỉ đo một góc ở bờ bên này là biết ngay góc ở bờ bên kia và hai góc ở đáy. ' +
      'Hình ấy là hình thang cân, một loại tứ giác đặc biệt. Bài này tìm hiểu tứ giác nói chung (tổng bốn góc luôn bằng 360°) rồi đến hình thang cân.',
    theory:
      'TỨ GIÁC\n' +
      'Tứ giác ABCD gồm bốn đoạn thẳng AB, BC, CD, DA, trong đó không có ba điểm nào thẳng hàng và hai đoạn bất kỳ không cắt nhau ngoài đầu mút. ' +
      'A, B, C, D là các đỉnh; AB, BC, CD, DA là các cạnh; AC và BD là hai đường chéo. Trong bài này ta chỉ xét tứ giác lồi, tức là tứ giác nằm về một phía của đường thẳng chứa mỗi cạnh của nó.\n\n' +
      'TỔNG CÁC GÓC CỦA TỨ GIÁC\n' +
      'Định lí: tổng bốn góc của một tứ giác bằng 360°, tức ∠A + ∠B + ∠C + ∠D = 360°.\n' +
      'Vì sao đúng? Kẻ đường chéo AC. Nó chia tứ giác thành hai tam giác ABC và ACD. Tổng các góc mỗi tam giác là 180°. Các góc của hai tam giác ghép lại đúng thành bốn góc của tứ giác (tia AC nằm trong góc A, tia CA nằm trong góc C) nên tổng bốn góc là 180° + 180° = 360°.\n\n' +
      'HÌNH THANG VÀ HÌNH THANG CÂN\n' +
      '— Hình thang là tứ giác có hai cạnh đối song song. Hai cạnh song song gọi là hai đáy, hai cạnh còn lại gọi là hai cạnh bên.\n' +
      '— Với hình thang ABCD có AB // CD, hai góc kề một cạnh bên là hai góc trong cùng phía nên bù nhau: ∠A + ∠D = 180° và ∠B + ∠C = 180°.\n' +
      '— Hình thang cân là hình thang có hai góc kề một đáy bằng nhau.\n\n' +
      'TÍNH CHẤT CỦA HÌNH THANG CÂN\n' +
      'Trong hình thang cân: hai cạnh bên bằng nhau và hai đường chéo bằng nhau.\n' +
      'Vì sao hai đường chéo bằng nhau? Xét hình thang cân ABCD (AB // CD) có ∠ADC = ∠BCD và AD = BC. Hai tam giác ADC và BCD có AD = BC, ∠ADC = ∠BCD, cạnh DC chung nên bằng nhau (c.g.c). Suy ra AC = BD.\n\n' +
      'DẤU HIỆU NHẬN BIẾT HÌNH THANG CÂN\n' +
      '— Hình thang có hai góc kề một đáy bằng nhau là hình thang cân (chính là định nghĩa).\n' +
      '— Hình thang có hai đường chéo bằng nhau là hình thang cân.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm tổng bốn góc của tứ giác với 180° (của tam giác). Tổng bốn góc của tứ giác là 360°.\n' +
      '— Cho rằng hình thang có hai cạnh bên bằng nhau thì là hình thang cân. Chưa đúng: hình bình hành (không có góc vuông) cũng là hình thang có hai cạnh bên bằng nhau nhưng không phải hình thang cân.\n' +
      '— Nhầm hai góc kề một cạnh bên (bù nhau) với hai góc kề một đáy (bằng nhau trong hình thang cân).',
    workedExample: {
      problem:
        'Hình thang cân ABCD có đáy AB // CD và ∠D = 70°. Tính ∠C, ∠A, ∠B, rồi kiểm tra tổng bốn góc.',
      steps: [
        'Hai góc D và C cùng kề đáy CD. Hình thang cân có hai góc kề một đáy bằng nhau nên ∠C = ∠D = 70°.',
        'AB // CD nên hai góc A và D (trong cùng phía) bù nhau: ∠A = 180° − 70° = 110°.',
        'Hai góc A và B cùng kề đáy AB nên ∠B = ∠A = 110°.',
        'Kiểm tra: 70° + 70° + 110° + 110° = 360°, đúng với định lí tổng các góc của tứ giác.',
      ],
      answer: '∠C = 70°, ∠A = ∠B = 110°; tổng bốn góc bằng 360°.',
    },
    checkQuestions: [
      {
        prompt: 'Tứ giác MNPQ có ∠M = 80°, ∠N = 95°, ∠P = 110°. Tính ∠Q (đơn vị độ).',
        answer: { kind: 'numeric', value: 75 },
        explain:
          'Tổng bốn góc của tứ giác bằng 360° nên ∠Q = 360° − (80° + 95° + 110°) = 75°. Lỗi hay gặp là lấy 180° trừ đi tổng ba góc vì nhầm với tam giác, ra số âm.',
      },
      {
        prompt:
          'Mặt cắt của một con kênh là hình thang cân ABCD có đáy nhỏ AB // CD (đáy lớn). Góc ở đáy lớn ∠D đo được 55°. Tính góc ∠A ở đáy nhỏ (đơn vị độ).',
        answer: { kind: 'numeric', value: 125 },
        explain:
          'AB // CD nên ∠A và ∠D là hai góc trong cùng phía, bù nhau: ∠A = 180° − 55° = 125°. Lỗi hay gặp là cho ∠A = ∠D = 55°, nhầm hai góc kề một cạnh bên (bù nhau) với hai góc kề cùng một đáy.',
      },
      {
        prompt: 'Tứ giác ABCD có các góc ∠A : ∠B : ∠C : ∠D = 1 : 2 : 3 : 4. Tính ∠D (đơn vị độ).',
        answer: { kind: 'numeric', value: 144 },
        explain:
          'Bốn góc gồm 1 + 2 + 3 + 4 = 10 phần, tổng 360° nên mỗi phần là 36° và ∠D = 4 × 36° = 144°. Lỗi hay gặp là chia cho tổng 180° thay vì 360°, ra ∠D = 72°.',
      },
      {
        prompt: 'Tứ giác nào sau đây chắc chắn là hình thang cân?',
        choices: [
          { id: 'a', label: 'Hình thang có hai đường chéo bằng nhau' },
          { id: 'b', label: 'Hình thang có hai cạnh bên bằng nhau' },
          { id: 'c', label: 'Tứ giác có hai cạnh đối bằng nhau' },
          { id: 'd', label: 'Tứ giác có hai đường chéo cắt nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hình thang có hai đường chéo bằng nhau là hình thang cân (dấu hiệu nhận biết). Hình thang có hai cạnh bên bằng nhau có thể là hình bình hành, không phải hình thang cân; hai ý còn lại chưa đủ để có hai đáy song song.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tổng bốn góc của một tứ giác bằng bao nhiêu và vì sao?',
        dap: '360°. Kẻ một đường chéo chia tứ giác thành hai tam giác, mỗi tam giác có tổng ba góc 180°.',
      },
      {
        hoi: 'Hình thang cân là gì? Hai tính chất chính?',
        dap: 'Hình thang có hai góc kề một đáy bằng nhau. Hai cạnh bên bằng nhau và hai đường chéo bằng nhau.',
      },
      {
        hoi: 'Dấu hiệu nhận biết hình thang cân?',
        dap: 'Hình thang có hai góc kề một đáy bằng nhau, hoặc hình thang có hai đường chéo bằng nhau.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c3-b2',
    grade: '8',
    chapterNumber: 3,
    chapterTitle: 'Tứ giác',
    lessonNumber: 2,
    title: 'Hình bình hành và hình thoi',
    hook:
      'Cổng sắt xếp ở cửa hàng có thể kéo ra hoặc thu lại: các ô của nó đổi hình dạng liên tục nhưng bốn thanh sắt của mỗi ô luôn bằng nhau. ' +
      'Giá nâng kiểu kéo cắt dưới gầm xe cũng hoạt động nhờ những ô như thế. Mỗi ô ấy là một hình thoi, mà hình thoi lại là một hình bình hành đặc biệt. ' +
      'Bài này tìm hiểu tính chất và cách nhận biết hai hình đó.',
    theory:
      'HÌNH BÌNH HÀNH\n' +
      '— Hình bình hành là tứ giác có các cạnh đối song song: AB // CD và AD // BC.\n' +
      '— Tính chất: các cạnh đối bằng nhau; các góc đối bằng nhau; hai đường chéo cắt nhau tại trung điểm của mỗi đường.\n' +
      'Vì sao? Kẻ đường chéo AC. Vì AB // CD nên ∠BAC = ∠DCA (so le trong), vì AD // BC nên ∠BCA = ∠DAC (so le trong), lại có AC chung. Hai tam giác ABC và CDA bằng nhau (g.c.g), suy ra AB = CD, BC = DA và ∠B = ∠D.\n' +
      '— Hai góc kề một cạnh bù nhau: ∠A + ∠B = 180°.\n\n' +
      'DẤU HIỆU NHẬN BIẾT HÌNH BÌNH HÀNH\n' +
      'Tứ giác là hình bình hành nếu có một trong các điều kiện:\n' +
      '— các cạnh đối song song;\n' +
      '— hai cạnh đối song song và bằng nhau;\n' +
      '— các cạnh đối bằng nhau;\n' +
      '— các góc đối bằng nhau;\n' +
      '— hai đường chéo cắt nhau tại trung điểm của mỗi đường.\n\n' +
      'HÌNH THOI\n' +
      '— Hình thoi là tứ giác có bốn cạnh bằng nhau. Hình thoi có các cạnh đối bằng nhau nên là hình bình hành, vì thế có mọi tính chất của hình bình hành.\n' +
      '— Tính chất riêng: hai đường chéo vuông góc với nhau và là các đường phân giác của các góc của hình thoi.\n' +
      'Vì sao? Gọi O là giao điểm hai đường chéo, O là trung điểm AC. Tam giác BAC cân tại B (BA = BC) có BO là trung tuyến nên cũng là đường cao và đường phân giác, do đó BD ⊥ AC và BD phân giác góc B. Tương tự cho các đỉnh còn lại.\n\n' +
      'DẤU HIỆU NHẬN BIẾT HÌNH THOI\n' +
      '— Tứ giác có bốn cạnh bằng nhau.\n' +
      '— Hình bình hành có hai cạnh kề bằng nhau.\n' +
      '— Hình bình hành có hai đường chéo vuông góc với nhau.\n' +
      '— Hình bình hành có một đường chéo là đường phân giác của một góc.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng tứ giác có hai cạnh đối bằng nhau là hình bình hành. Hình thang cân cũng có hai cạnh bên bằng nhau nhưng không phải hình bình hành; phải có CẢ HAI cặp cạnh đối bằng nhau, hoặc một cặp vừa song song vừa bằng nhau.\n' +
      '— Kết luận tứ giác có hai đường chéo vuông góc là hình thoi. Phải là hình bình hành (hoặc hai đường chéo cắt nhau tại trung điểm) rồi mới dùng dấu hiệu này.\n' +
      '— Cho rằng hai đường chéo của hình thoi bằng nhau. Hai đường chéo của hình thoi vuông góc, nói chung không bằng nhau.',
    workedExample: {
      problem:
        'Hình thoi ABCD có ∠A = 60° và AB = 6 cm. a) Tính ∠B, ∠C, ∠D. b) Chứng minh tam giác ABD là tam giác đều rồi tính độ dài đường chéo BD và chu vi hình thoi.',
      steps: [
        'Hình thoi là hình bình hành nên góc đối bằng nhau: ∠C = ∠A = 60°.',
        'AD // BC nên ∠A + ∠B = 180°, suy ra ∠B = 180° − 60° = 120°, và ∠D = ∠B = 120°. Kiểm tra: 60° + 120° + 60° + 120° = 360°.',
        'Hình thoi có bốn cạnh bằng nhau nên AB = AD, tam giác ABD cân tại A. Góc ở đỉnh ∠A = 60° nên hai góc ở đáy bằng (180° − 60°) : 2 = 60°. Ba góc cùng 60° nên tam giác ABD đều.',
        'Tam giác ABD đều nên BD = AB = 6 cm. Chu vi hình thoi bằng 4 × 6 = 24 cm.',
      ],
      answer: '∠B = ∠D = 120°, ∠C = 60°; BD = 6 cm; chu vi 24 cm.',
    },
    checkQuestions: [
      {
        prompt: 'Hình bình hành ABCD có AB = 7 cm và BC = 4,5 cm. Tính chu vi (đơn vị cm).',
        answer: { kind: 'numeric', value: 23 },
        explain:
          'Các cạnh đối của hình bình hành bằng nhau nên chu vi là 2 × (7 + 4,5) = 23 cm. Lỗi hay gặp là chỉ cộng một lần (7 + 4,5 = 11,5) vì quên còn hai cạnh đối nữa.',
      },
      {
        prompt:
          'Một ô của cổng sắt xếp là hình bình hành ABCD. Khi kéo cổng ra, góc ∠A của ô đo được 50°. Tính ∠B (đơn vị độ).',
        answer: { kind: 'numeric', value: 130 },
        explain:
          'Hai góc kề một cạnh của hình bình hành bù nhau (vì AD // BC) nên ∠B = 180° − 50° = 130°. Lỗi hay gặp là cho ∠B = ∠A = 50°, nhầm góc kề với góc đối (góc đối ∠C mới bằng ∠A).',
      },
      {
        prompt:
          'Hình thoi ABCD có hai đường chéo AC và BD cắt nhau tại O. Biết ∠ABD = 35°. Tính ∠BAC (đơn vị độ).',
        answer: { kind: 'numeric', value: 55 },
        explain:
          'Hai đường chéo của hình thoi vuông góc nên tam giác ABO vuông tại O, suy ra ∠BAC = ∠BAO = 90° − 35° = 55°. Lỗi hay gặp là quên tính chất vuông góc rồi dùng tổng 180° của tam giác ABD.',
      },
      {
        prompt: 'Tứ giác nào sau đây chắc chắn là hình thoi?',
        choices: [
          { id: 'a', label: 'Hình bình hành có hai đường chéo vuông góc' },
          { id: 'b', label: 'Tứ giác có hai đường chéo vuông góc' },
          { id: 'c', label: 'Hình bình hành có hai đường chéo bằng nhau' },
          { id: 'd', label: 'Tứ giác có hai cạnh kề bằng nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hình bình hành có hai đường chéo vuông góc là hình thoi (dấu hiệu nhận biết). Tứ giác chỉ có hai đường chéo vuông góc chưa chắc là hình thoi; hình bình hành có hai đường chéo bằng nhau là hình chữ nhật.',
      },
    ],
    srsCards: [
      {
        hoi: 'Ba tính chất của hình bình hành?',
        dap: 'Cạnh đối bằng nhau, góc đối bằng nhau, hai đường chéo cắt nhau tại trung điểm của mỗi đường.',
      },
      {
        hoi: 'Hình thoi là gì? Tính chất riêng của hình thoi?',
        dap: 'Tứ giác có bốn cạnh bằng nhau (là hình bình hành đặc biệt). Hai đường chéo vuông góc và là phân giác của các góc.',
      },
      {
        hoi: 'Hai dấu hiệu nhận biết hình thoi từ hình bình hành?',
        dap: 'Hình bình hành có hai cạnh kề bằng nhau, hoặc có hai đường chéo vuông góc.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c3-b3',
    grade: '8',
    chapterNumber: 3,
    chapterTitle: 'Tứ giác',
    lessonNumber: 3,
    title: 'Hình chữ nhật và hình vuông',
    hook:
      'Trước khi đổ móng, bác thợ xây căng dây theo bốn góc rồi đo hai đường chéo: nếu hai đường chéo bằng nhau thì móng đã vuông vức. ' +
      'Bác không cần ê-ke to, chỉ cần một cuộn thước. Mẹo ấy dựa trên tính chất của hình chữ nhật. ' +
      'Bài này nói về hình chữ nhật, hình vuông và một kết quả rất đẹp về đường trung tuyến của tam giác vuông.',
    theory:
      'HÌNH CHỮ NHẬT\n' +
      '— Hình chữ nhật là tứ giác có bốn góc vuông. Hai cạnh đối cùng vuông góc với một cạnh kề nên song song, do đó hình chữ nhật là hình bình hành (và cũng là hình thang cân).\n' +
      '— Tính chất: có mọi tính chất của hình bình hành, và hai đường chéo bằng nhau (cắt nhau tại trung điểm của mỗi đường).\n' +
      'Vì sao hai đường chéo bằng nhau? Hai tam giác ABC và DCB có AB = DC, ∠ABC = ∠DCB = 90°, BC chung nên bằng nhau (c.g.c), suy ra AC = DB.\n\n' +
      'DẤU HIỆU NHẬN BIẾT HÌNH CHỮ NHẬT\n' +
      '— Tứ giác có ba góc vuông.\n' +
      '— Hình bình hành có một góc vuông.\n' +
      '— Hình bình hành có hai đường chéo bằng nhau (đây là mẹo của bác thợ xây).\n\n' +
      'TRUNG TUYẾN ỨNG VỚI CẠNH HUYỀN\n' +
      'Trong tam giác vuông, đường trung tuyến ứng với cạnh huyền bằng nửa cạnh huyền.\n' +
      'Vì sao? Tam giác ABC vuông tại A, M là trung điểm BC. Lấy D sao cho M là trung điểm AD. Tứ giác ABDC có hai đường chéo AD, BC cắt nhau tại trung điểm mỗi đường nên là hình bình hành; nó có ∠A = 90° nên là hình chữ nhật. Hai đường chéo của hình chữ nhật bằng nhau: AD = BC, suy ra AM = AD : 2 = BC : 2.\n' +
      'Ngược lại, tam giác có đường trung tuyến bằng nửa cạnh tương ứng thì tam giác đó vuông tại đỉnh xuất phát đường trung tuyến.\n\n' +
      'HÌNH VUÔNG\n' +
      '— Hình vuông là tứ giác có bốn góc vuông và bốn cạnh bằng nhau; nó vừa là hình chữ nhật, vừa là hình thoi.\n' +
      '— Tính chất: hai đường chéo bằng nhau, vuông góc với nhau, cắt nhau tại trung điểm và là các đường phân giác của các góc.\n' +
      '— Dấu hiệu nhận biết: hình chữ nhật có hai cạnh kề bằng nhau; hình chữ nhật có hai đường chéo vuông góc; hình thoi có một góc vuông; hình thoi có hai đường chéo bằng nhau.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Kết luận tứ giác có hai đường chéo bằng nhau là hình chữ nhật. Hình thang cân cũng có hai đường chéo bằng nhau; phải là hình bình hành trước.\n' +
      '— Cho rằng hình chữ nhật không bao giờ là hình vuông, hay hình vuông không phải hình thoi. Hình vuông là trường hợp đặc biệt của cả hai.\n' +
      '— Dùng tính chất trung tuyến cho tam giác không vuông, hoặc cho trung tuyến ứng với cạnh góc vuông (chỉ đúng với cạnh huyền).',
    workedExample: {
      problem:
        'Tam giác ABC vuông tại A, M là trung điểm của BC, AM = 6,5 cm và ∠B = 40°. a) Tính BC. b) Tính ∠MAC.',
      steps: [
        'Tam giác ABC vuông tại A có AM là trung tuyến ứng với cạnh huyền BC nên AM = BC : 2.',
        'Suy ra BC = 2 × AM = 2 × 6,5 = 13 cm.',
        'Hai góc nhọn của tam giác vuông phụ nhau: ∠C = 90° − 40° = 50°.',
        'Vì AM = MC (cùng bằng nửa BC) nên tam giác MAC cân tại M, suy ra ∠MAC = ∠C = 50°. Kiểm tra: ∠MAB = ∠B = 40° và ∠MAB + ∠MAC = 90°, đúng bằng góc A.',
      ],
      answer: 'BC = 13 cm; ∠MAC = 50°.',
    },
    checkQuestions: [
      {
        prompt:
          'Tam giác DEF vuông tại D, trung tuyến DM ứng với cạnh huyền EF dài 9 cm. Tính EF (đơn vị cm).',
        answer: { kind: 'numeric', value: 18 },
        explain:
          'Trung tuyến ứng với cạnh huyền bằng nửa cạnh huyền nên EF = 2 × 9 = 18 cm. Lỗi hay gặp là cho EF = DM = 9 cm hoặc lấy một nửa của 9 vì nhớ ngược quan hệ.',
      },
      {
        prompt:
          'Bác thợ xây đo móng nhà hình bình hành ABCD thì thấy hai đường chéo AC và BD bằng nhau. Kết luận nào chắc chắn đúng?',
        choices: [
          { id: 'a', label: 'ABCD là hình chữ nhật' },
          { id: 'b', label: 'ABCD là hình thoi' },
          { id: 'c', label: 'ABCD là hình vuông' },
          { id: 'd', label: 'ABCD có bốn cạnh bằng nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hình bình hành có hai đường chéo bằng nhau là hình chữ nhật. Chưa đủ để nói là hình vuông hay hình thoi vì chưa biết hai cạnh kề có bằng nhau không; lỗi hay gặp là kết luận quá mức thành hình vuông.',
      },
      {
        prompt: 'Phát biểu nào sau đây đúng?',
        choices: [
          { id: 'a', label: 'Mọi hình thoi đều là hình vuông' },
          { id: 'b', label: 'Mọi hình vuông đều là hình thoi' },
          { id: 'c', label: 'Mọi hình chữ nhật đều là hình vuông' },
          { id: 'd', label: 'Hình bình hành có hai đường chéo vuông góc là hình chữ nhật' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Hình vuông có bốn cạnh bằng nhau nên là hình thoi. Chiều ngược lại sai: hình thoi chỉ là hình vuông khi có một góc vuông. Hình bình hành có hai đường chéo vuông góc là hình thoi chứ chưa là hình chữ nhật.',
      },
      {
        prompt:
          'Hình chữ nhật ABCD có hai đường chéo cắt nhau tại O và ∠AOB = 70°. Tính ∠OAB (đơn vị độ).',
        answer: { kind: 'numeric', value: 55 },
        explain:
          'Hai đường chéo của hình chữ nhật bằng nhau và cắt nhau tại trung điểm nên OA = OB, tam giác OAB cân tại O và ∠OAB = (180° − 70°) : 2 = 55°. Lỗi hay gặp là cho ∠OAB = 90° − 70° = 20° vì tưởng đường chéo vuông góc với cạnh.',
      },
    ],
    srsCards: [
      {
        hoi: 'Ba dấu hiệu nhận biết hình chữ nhật?',
        dap: 'Tứ giác có ba góc vuông; hình bình hành có một góc vuông; hình bình hành có hai đường chéo bằng nhau.',
      },
      {
        hoi: 'Đường trung tuyến ứng với cạnh huyền của tam giác vuông có tính chất gì?',
        dap: 'Bằng nửa cạnh huyền.',
      },
      {
        hoi: 'Hình vuông có quan hệ gì với hình chữ nhật và hình thoi?',
        dap: 'Hình vuông vừa là hình chữ nhật (bốn góc vuông) vừa là hình thoi (bốn cạnh bằng nhau).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
