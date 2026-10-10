// lessons/toan9c9.ts — Toán 9, Chương 9: Đường tròn ngoại tiếp và đường tròn nội tiếp.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C9_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c9-b1',
    grade: '9',
    chapterNumber: 9,
    chapterTitle: 'Đường tròn ngoại tiếp và đường tròn nội tiếp',
    lessonNumber: 1,
    title: 'Góc nội tiếp',
    hook:
      'Trên sân bóng, hai cột gôn là hai điểm A và B. Cầu thủ đứng ở bất kì điểm nào trên cùng một cung tròn đi qua A và B sẽ nhìn khung thành dưới cùng một góc sút. ' +
      'Đứng ở đâu để góc sút rộng hơn là điều mà huấn luyện viên rất quan tâm. ' +
      'Bài này dạy em góc nội tiếp, loại góc có đỉnh nằm ngay trên đường tròn, và mối liên hệ của nó với cung bị chắn.',
    theory:
      'GÓC NỘI TIẾP\n' +
      'Góc nội tiếp là góc có đỉnh nằm trên đường tròn và hai cạnh chứa hai dây của đường tròn. Cung nằm bên trong góc gọi là cung bị chắn.\n' +
      'Ví dụ: ∠ACB có đỉnh C trên đường tròn, hai cạnh CA, CB là hai dây, và chắn cung AB.\n\n' +
      'ĐỊNH LÍ\n' +
      'Số đo của góc nội tiếp bằng nửa số đo của cung bị chắn. Vì số đo cung bằng số đo góc ở tâm cùng chắn cung đó, nên góc nội tiếp bằng nửa góc ở tâm cùng chắn một cung.\n' +
      '   ∠ACB = (1/2) · số đo cung AB = (1/2) · ∠AOB\n' +
      'VÌ SAO? Xét trường hợp tâm O nằm trên cạnh CB (các trường hợp còn lại suy ra từ đây). Tam giác OAC cân tại O nên ∠OCA = ∠OAC. Góc ở tâm ∠AOB là góc ngoài của tam giác OAC nên ∠AOB = ∠OCA + ∠OAC = 2 · ∠ACB.\n\n' +
      'HỆ QUẢ\n' +
      '— Các góc nội tiếp cùng chắn một cung thì bằng nhau.\n' +
      '— Góc nội tiếp chắn nửa đường tròn (chắn cung 180°, hay dây là đường kính) là góc vuông, bằng 90°.\n' +
      '— Ngược lại, góc nội tiếp bằng 90° thì chắn nửa đường tròn, tức cạnh đối diện là một đường kính.\n' +
      'Hệ quả thứ hai cho ta cách tìm cạnh trong tam giác nội tiếp có một cạnh là đường kính: đó là tam giác vuông, dùng được định lí Pythagore.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Lấy góc nội tiếp bằng đúng số đo cung (quên chia đôi), hoặc lấy góc ở tâm bằng nửa số đo cung (nhân đôi nhầm chiều).\n' +
      '— Nhầm cung bị chắn: phải chọn cung nằm bên trong góc, không phải cung chứa đỉnh góc.\n' +
      '— Cho rằng mọi góc nội tiếp đều bằng 90°: chỉ góc nội tiếp chắn nửa đường tròn (dây là đường kính) mới vuông.',
    workedExample: {
      problem:
        'a) Cho đường tròn (O), góc ở tâm ∠AOB = 100° và điểm C nằm trên cung lớn AB. Tính ∠ACB. ' +
        'b) Tam giác ABC nội tiếp đường tròn tâm O, có AB là đường kính, AB = 10 cm và AC = 6 cm. Tính ∠ACB và độ dài BC.',
      steps: [
        'a) Cung nhỏ AB có số đo bằng góc ở tâm, tức 100°.',
        'a) ∠ACB là góc nội tiếp chắn cung nhỏ AB, nên ∠ACB = 100° : 2 = 50°. Mọi điểm C khác trên cung lớn AB đều cho cùng góc 50°.',
        'b) AB là đường kính nên ∠ACB là góc nội tiếp chắn nửa đường tròn, do đó ∠ACB = 90°.',
        'b) Tam giác ABC vuông tại C, theo Pythagore: BC² = AB² − AC² = 100 − 36 = 64, nên BC = 8 cm.',
      ],
      answer: 'a) ∠ACB = 50°. b) ∠ACB = 90° và BC = 8 cm.',
    },
    checkQuestions: [
      {
        prompt:
          'Trên đường tròn (O), cung nhỏ AB có số đo 110° và điểm C nằm trên cung lớn AB. Góc nội tiếp ∠ACB bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 55 },
        explain:
          'Góc nội tiếp bằng nửa số đo cung bị chắn: ∠ACB = 110° : 2 = 55°. ' +
          'Lỗi hay gặp là lấy ∠ACB = 110° (quên chia đôi), đó mới là số đo của góc ở tâm ∠AOB.',
      },
      {
        prompt:
          'Góc nội tiếp ∠ACB của đường tròn (O) bằng 35°. Góc ở tâm ∠AOB chắn cùng cung AB bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 70 },
        explain:
          'Góc ở tâm gấp đôi góc nội tiếp cùng chắn một cung: ∠AOB = 2 · 35° = 70°. ' +
          'Lỗi hay gặp là chia đôi thay vì nhân đôi, được 17,5°.',
      },
      {
        prompt:
          'Cho AB là đường kính của một đường tròn và C là điểm bất kì trên đường tròn, khác A và B. Góc ∠ACB bằng bao nhiêu?',
        choices: [
          { id: 'a', label: '90°' },
          { id: 'b', label: '45°' },
          { id: 'c', label: '60°' },
          { id: 'd', label: '180°' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'AB là đường kính nên cung AB là nửa đường tròn, có số đo 180°; góc nội tiếp chắn nó bằng 180° : 2 = 90°. ' +
          'Đáp án d nhầm với số đo cung, b và c không xảy ra với mọi vị trí của C.',
      },
      {
        prompt:
          'Tam giác ABC nội tiếp đường tròn có đường kính AB = 26 cm. Biết AC = 10 cm. Độ dài BC bằng bao nhiêu xentimét?',
        answer: { kind: 'numeric', value: 24 },
        explain:
          'AB là đường kính nên ∠ACB = 90°, tam giác ABC vuông tại C. BC² = AB² − AC² = 676 − 100 = 576, nên BC = 24 cm. ' +
          'Lỗi hay gặp là tính BC² = 26² + 10² vì tưởng AB không phải cạnh huyền.',
      },
    ],
    srsCards: [
      {
        hoi: 'Góc nội tiếp là gì? Số đo của nó liên hệ thế nào với cung bị chắn?',
        dap: 'Góc có đỉnh trên đường tròn, hai cạnh chứa hai dây. Số đo bằng nửa số đo cung bị chắn (cũng bằng nửa góc ở tâm cùng chắn một cung).',
      },
      {
        hoi: 'Các góc nội tiếp cùng chắn một cung thì thế nào?',
        dap: 'Bằng nhau.',
      },
      {
        hoi: 'Góc nội tiếp chắn nửa đường tròn bằng bao nhiêu?',
        dap: '90° (dây chắn là đường kính). Ngược lại, góc nội tiếp 90° thì chắn nửa đường tròn.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c9-b2',
    grade: '9',
    chapterNumber: 9,
    chapterTitle: 'Đường tròn ngoại tiếp và đường tròn nội tiếp',
    lessonNumber: 2,
    title: 'Đường tròn ngoại tiếp, nội tiếp tam giác và tứ giác nội tiếp',
    hook:
      'Cô giáo phát cho mỗi nhóm một mảnh bìa hình tam giác và giao hai việc: cắt một chiếc đĩa tròn lớn nhất đặt vừa trong mảnh bìa, ' +
      'và vẽ một vòng tròn đi qua cả ba đỉnh của nó. Để làm đúng, nhóm phải xác định được tâm và bán kính của từng đường tròn. ' +
      'Bài này dạy em hai đường tròn đặc biệt của tam giác và nhận biết tứ giác nội tiếp.',
    theory:
      'ĐƯỜNG TRÒN NGOẠI TIẾP TAM GIÁC\n' +
      'Đường tròn đi qua ba đỉnh của tam giác là đường tròn ngoại tiếp tam giác đó. Tâm của nó là giao điểm của ba đường trung trực của các cạnh, bán kính R gọi là bán kính ngoại tiếp.\n' +
      'VÌ SAO? Tâm phải cách đều ba đỉnh, mà tập các điểm cách đều hai đỉnh là đường trung trực của đoạn nối chúng.\n' +
      'Trường hợp đặc biệt: tam giác vuông có tâm ngoại tiếp là trung điểm cạnh huyền, nên R = (cạnh huyền)/2 (vì góc vuông chắn nửa đường tròn).\n\n' +
      'ĐƯỜNG TRÒN NỘI TIẾP TAM GIÁC\n' +
      'Đường tròn tiếp xúc với cả ba cạnh của tam giác (nằm trong tam giác) là đường tròn nội tiếp tam giác. Tâm của nó là giao điểm của ba đường phân giác trong, bán kính r gọi là bán kính nội tiếp.\n' +
      'VÌ SAO? Tâm phải cách đều ba cạnh, mà các điểm cách đều hai cạnh của một góc nằm trên phân giác của góc đó.\n' +
      '(Mở rộng) Nối tâm nội tiếp với ba đỉnh, tam giác được chia thành ba tam giác nhỏ có chiều cao cùng bằng r, nên diện tích S = (1/2) · r · (a + b + c) = p · r với p là nửa chu vi. Suy ra r = S/p.\n\n' +
      'TAM GIÁC ĐỀU\n' +
      'Tam giác đều cạnh a có tâm ngoại tiếp trùng tâm nội tiếp (giao ba đường trung tuyến):\n' +
      '   R = a√3/3 ;  r = a√3/6 (nên R = 2r).\n' +
      'Ví dụ a = 12 thì R = 4√3 ≈ 6,93 và r = 2√3 ≈ 3,46.\n\n' +
      'TỨ GIÁC NỘI TIẾP\n' +
      'Tứ giác có bốn đỉnh cùng nằm trên một đường tròn gọi là tứ giác nội tiếp đường tròn.\n' +
      'Định lí: trong tứ giác nội tiếp, tổng hai góc đối bằng 180°. Ngược lại, tứ giác có tổng hai góc đối bằng 180° thì nội tiếp được đường tròn.\n' +
      'Ví dụ: hình chữ nhật và hình vuông luôn nội tiếp, tâm đường tròn là giao điểm hai đường chéo, bán kính bằng nửa đường chéo. Hình vuông cạnh a có đường chéo a√2 nên R = a√2/2.\n' +
      'Hình bình hành không phải hình chữ nhật và hình thoi không phải hình vuông thì không nội tiếp (hai góc đối bằng nhau nên tổng bằng 180° chỉ khi cùng bằng 90°, mà khi đó là hình chữ nhật).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm hai tâm: ngoại tiếp là giao ba trung trực, nội tiếp là giao ba phân giác.\n' +
      '— Cho rằng tâm ngoại tiếp tam giác luôn nằm trong tam giác (chỉ đúng khi tam giác nhọn; tam giác vuông thì nằm trên cạnh huyền).\n' +
      '— Cộng hai góc kề (không phải góc đối) rồi cho bằng 180°.\n' +
      '— Quên chia đôi: R của tam giác vuông bằng nửa cạnh huyền, không bằng cạnh huyền.',
    workedExample: {
      problem:
        'a) Tam giác ABC vuông tại A có AB = 6 cm, AC = 8 cm. Tính bán kính đường tròn ngoại tiếp R. ' +
        'b) Tứ giác ABCD nội tiếp đường tròn có ∠A = 105° và ∠B = 80°. Tính ∠C và ∠D. ' +
        'c) Tam giác đều cạnh 12 cm có bán kính ngoại tiếp và nội tiếp là bao nhiêu (làm tròn đến hàng phần trăm)?',
      steps: [
        'a) Theo Pythagore, BC² = 36 + 64 = 100 nên BC = 10 cm. Tâm đường tròn ngoại tiếp là trung điểm của BC, nên R = 10 : 2 = 5 cm.',
        'b) Trong tứ giác nội tiếp, hai góc đối bù nhau: ∠C = 180° − ∠A = 180° − 105° = 75°.',
        'b) ∠D = 180° − ∠B = 180° − 80° = 100°. Kiểm tra tổng bốn góc: 105° + 80° + 75° + 100° = 360°.',
        'c) R = a√3/3 = 12√3/3 = 4√3 ≈ 6,93 cm.',
        'c) Bán kính nội tiếp của tam giác đều: r = a√3/6 = 12√3/6 = 2√3 ≈ 3,46 cm (đúng bằng một nửa R).',
      ],
      answer: 'a) R = 5 cm. b) ∠C = 75°, ∠D = 100°. c) R ≈ 6,93 cm, r ≈ 3,46 cm.',
    },
    checkQuestions: [
      {
        prompt:
          'Tam giác vuông có hai cạnh góc vuông dài 9 cm và 12 cm. Bán kính đường tròn ngoại tiếp tam giác bằng bao nhiêu xentimét? Nhập dưới dạng số thập phân.',
        answer: { kind: 'numeric', value: 7.5 },
        explain:
          'Cạnh huyền là √(81 + 144) = √225 = 15 cm. Tâm ngoại tiếp là trung điểm cạnh huyền nên R = 15 : 2 = 7,5 cm. ' +
          'Lỗi hay gặp là lấy R bằng cả cạnh huyền 15 cm.',
      },
      {
        prompt: 'Tứ giác nào sau đây luôn nội tiếp được một đường tròn?',
        choices: [
          { id: 'a', label: 'Hình bình hành bất kì' },
          { id: 'b', label: 'Hình thoi bất kì' },
          { id: 'c', label: 'Hình chữ nhật' },
          { id: 'd', label: 'Hình thang bất kì' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Hình chữ nhật có bốn góc đều bằng 90° nên hai góc đối có tổng 180°, vì vậy luôn nội tiếp (tâm là giao hai đường chéo). ' +
          'Hình bình hành, hình thoi hay hình thang bất kì không bảo đảm hai góc đối bù nhau.',
      },
      {
        prompt: 'Tứ giác ABCD nội tiếp đường tròn và ∠B = 72°. Số đo góc ∠D bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 108 },
        explain:
          'B và D là hai góc đối của tứ giác nội tiếp nên ∠B + ∠D = 180°, suy ra ∠D = 180° − 72° = 108°. ' +
          'Lỗi hay gặp là lấy 72° (cho hai góc đối bằng nhau) hoặc dùng 360° − 72°.',
      },
      {
        prompt: 'Tam giác đều cạnh 18 cm có bán kính đường tròn nội tiếp bằng k√3 cm. Nhập số k.',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Bán kính nội tiếp của tam giác đều cạnh a là r = a√3/6 = 18√3/6 = 3√3, nên k = 3. ' +
          'Lỗi hay gặp là dùng công thức của bán kính ngoại tiếp a√3/3, được 6√3 (gấp đôi).',
      },
    ],
    srsCards: [
      {
        hoi: 'Tâm đường tròn ngoại tiếp và nội tiếp tam giác là giao điểm của những đường nào?',
        dap: 'Ngoại tiếp: giao ba đường trung trực. Nội tiếp: giao ba đường phân giác trong.',
      },
      {
        hoi: 'Tam giác vuông có tâm đường tròn ngoại tiếp ở đâu?',
        dap: 'Ở trung điểm cạnh huyền, nên R bằng nửa cạnh huyền.',
      },
      {
        hoi: 'Tam giác đều cạnh a có R và r bằng bao nhiêu?',
        dap: 'R = a√3/3 và r = a√3/6 (R = 2r).',
      },
      {
        hoi: 'Tính chất và dấu hiệu của tứ giác nội tiếp?',
        dap: 'Tổng hai góc đối bằng 180°; ngược lại, tứ giác có tổng hai góc đối bằng 180° thì nội tiếp được. Hình chữ nhật và hình vuông luôn nội tiếp.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c9-b3',
    grade: '9',
    chapterNumber: 9,
    chapterTitle: 'Đường tròn ngoại tiếp và đường tròn nội tiếp',
    lessonNumber: 3,
    title: 'Đa giác đều',
    hook:
      'Mỗi ô trong tổ ong là một hình lục giác đều, ghép khít với nhau không để lại khe hở. Biển báo STOP có dạng bát giác đều, ' +
      'còn bông hoa mướp hay bông tuyết cũng có cách sắp xếp rất đều đặn. ' +
      'Bài này dạy em đa giác đều là gì, cách tính số đo mỗi góc và vì sao chúng có tính đối xứng đẹp mắt như vậy.',
    theory:
      'ĐA GIÁC ĐỀU\n' +
      'Đa giác đều là đa giác lồi có tất cả các cạnh bằng nhau và tất cả các góc bằng nhau. Ví dụ: tam giác đều, hình vuông, ngũ giác đều, lục giác đều…\n' +
      'Chú ý: chỉ có cạnh bằng nhau thì chưa đủ (hình thoi), chỉ có góc bằng nhau thì cũng chưa đủ (hình chữ nhật). Phải có đồng thời cả hai điều kiện.\n\n' +
      'SỐ ĐO MỖI GÓC\n' +
      'Tổng các góc của đa giác n cạnh là (n − 2) · 180°. Vì n góc bằng nhau, mỗi góc của đa giác đều n cạnh có số đo:\n' +
      '   (n − 2) · 180° / n\n' +
      'Ví dụ: n = 3 thì 60°; n = 4 thì 90°; n = 5 thì 108°; n = 6 thì 120°; n = 8 thì 135°.\n\n' +
      'ĐƯỜNG TRÒN NGOẠI TIẾP VÀ NỘI TIẾP\n' +
      'Đa giác đều nào cũng có một đường tròn ngoại tiếp (đi qua các đỉnh) và một đường tròn nội tiếp (tiếp xúc với các cạnh), hai đường tròn này có chung tâm O gọi là tâm của đa giác đều. ' +
      'Nối tâm O với hai đỉnh liên tiếp ta được góc ở tâm chắn một cạnh bằng 360°/n.\n' +
      'Ví dụ lục giác đều: góc ở tâm 60° và OA = OB nên tam giác OAB đều, suy ra bán kính đường tròn ngoại tiếp bằng đúng độ dài cạnh.\n\n' +
      'PHÉP QUAY VÀ ĐỐI XỨNG\n' +
      '— Phép quay quanh tâm O một góc 360°/n (và các bội của nó) biến đa giác đều n cạnh thành chính nó: mỗi đỉnh chuyển sang đỉnh kế tiếp. Lục giác đều quay 60°, 120°, 180°… giữ nguyên; tam giác đều quay 120°, 240° giữ nguyên.\n' +
      '— Đa giác đều n cạnh có đúng n trục đối xứng (đi qua tâm). Với n lẻ, mỗi trục đi qua một đỉnh và trung điểm cạnh đối diện; với n chẵn, có n/2 trục đi qua hai đỉnh đối nhau và n/2 trục đi qua trung điểm hai cạnh đối nhau.\n' +
      '— Đa giác đều có số cạnh CHẴN thì có tâm đối xứng là tâm O (quay 180° giữ nguyên).\n' +
      'Trong đời sống: ô tổ ong (lục giác đều), biển STOP (bát giác đều), hoa văn gạch lát, bông tuyết đều dựa trên các tính chất này.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng công thức n · 180°/n hoặc quên trừ 2: (n − 2) · 180°, không phải n · 180°.\n' +
      '— Nghĩ rằng hình thoi (đủ cạnh) hoặc hình chữ nhật (đủ góc) là đa giác đều.\n' +
      '— Nhầm góc của đa giác (120° với lục giác) với góc ở tâm chắn một cạnh (60° với lục giác).',
    workedExample: {
      problem:
        'a) Tính số đo mỗi góc và số đo góc ở tâm chắn một cạnh của ngũ giác đều. ' +
        'b) Đa giác đều nào có mỗi góc bằng 140°? ' +
        'c) Lục giác đều ABCDEF cạnh 5 cm nội tiếp đường tròn tâm O. Tính bán kính đường tròn và chu vi lục giác.',
      steps: [
        'a) Với n = 5, mỗi góc là (5 − 2) · 180°/5 = 540°/5 = 108°.',
        'a) Góc ở tâm chắn một cạnh là 360°/5 = 72°.',
        'b) Giải (n − 2) · 180/n = 140: 180n − 360 = 140n, suy ra 40n = 360 và n = 9. Đó là đa giác đều 9 cạnh.',
        'c) Góc ở tâm chắn cạnh AB là 360°/6 = 60°. Tam giác OAB cân tại O (OA = OB) có góc ở đỉnh 60° nên là tam giác đều, suy ra OA = AB = 5 cm.',
        'c) Chu vi lục giác là 6 · 5 = 30 cm.',
      ],
      answer:
        'a) Mỗi góc 108°, góc ở tâm 72°. b) Đa giác đều 9 cạnh. c) Bán kính 5 cm, chu vi 30 cm.',
    },
    checkQuestions: [
      {
        prompt: 'Mỗi góc của thập giác đều (đa giác đều 10 cạnh) bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 144 },
        explain:
          'Mỗi góc bằng (10 − 2) · 180°/10 = 8 · 180°/10 = 1440°/10 = 144°. ' +
          'Lỗi hay gặp là quên trừ 2 và tính 10 · 180°/10 = 180°, hoặc lấy góc ở tâm 360°/10 = 36° làm góc của đa giác.',
      },
      {
        prompt:
          'Phép quay quanh tâm O với góc nào sau đây biến lục giác đều thành chính nó (và không phải góc 0°)?',
        choices: [
          { id: 'a', label: '30°' },
          { id: 'b', label: '60°' },
          { id: 'c', label: '90°' },
          { id: 'd', label: '100°' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Lục giác đều có góc ở tâm chắn một cạnh là 360°/6 = 60°, nên quay 60° đưa mỗi đỉnh sang đỉnh kế tiếp. ' +
          'Các góc 30°, 90°, 100° đều không là bội của 60°, nên làm đỉnh rơi vào vị trí không phải đỉnh.',
      },
      {
        prompt: 'Một đa giác đều có mỗi góc bằng 156°. Đa giác đó có bao nhiêu cạnh?',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'Từ (n − 2) · 180/n = 156 ta có 180n − 360 = 156n, suy ra 24n = 360 và n = 15. Kiểm tra: 13 · 180/15 = 156. ' +
          'Lỗi hay gặp là lấy 360/156 hoặc quên rằng góc bên trong khác góc ở tâm.',
      },
      {
        prompt: 'Biển báo STOP có dạng bát giác đều (8 cạnh). Biển có bao nhiêu trục đối xứng?',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'Đa giác đều n cạnh có đúng n trục đối xứng, nên bát giác đều có 8 trục: 4 trục đi qua hai đỉnh đối nhau và 4 trục đi qua trung điểm hai cạnh đối nhau. ' +
          'Lỗi hay gặp là chỉ đếm một loại trục và trả lời 4.',
      },
    ],
    srsCards: [
      {
        hoi: 'Thế nào là đa giác đều?',
        dap: 'Đa giác lồi có tất cả các cạnh bằng nhau và tất cả các góc bằng nhau.',
      },
      {
        hoi: 'Công thức số đo mỗi góc của đa giác đều n cạnh?',
        dap: '(n − 2) · 180°/n. Ví dụ ngũ giác đều: 108°; lục giác đều: 120°.',
      },
      {
        hoi: 'Phép quay nào giữ nguyên đa giác đều n cạnh?',
        dap: 'Phép quay quanh tâm O với góc 360°/n (và các bội của nó).',
      },
      {
        hoi: 'Đa giác đều n cạnh có bao nhiêu trục đối xứng? Khi nào có tâm đối xứng?',
        dap: 'Có n trục đối xứng; có tâm đối xứng khi n chẵn.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
