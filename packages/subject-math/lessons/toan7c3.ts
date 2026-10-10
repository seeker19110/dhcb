// lessons/toan7c3.ts — Toán 7, Chương 3: Góc và đường thẳng song song.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C3_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c3-b1',
    grade: '7',
    chapterNumber: 3,
    chapterTitle: 'Góc và đường thẳng song song',
    lessonNumber: 1,
    title: 'Góc ở vị trí đặc biệt và tia phân giác của một góc',
    hook:
      'Bạn mở chiếc kéo cắt giấy: hai lưỡi kéo bắt chéo nhau ở ốc giữa. Khi bạn mở lưỡi rộng ra thì hai cán kéo cũng mở rộng theo đúng một góc như vậy. ' +
      'Còn khi gấp đôi một tờ giấy hình quạt, nếp gấp chia góc đều thành hai phần bằng nhau. ' +
      'Những chiếc kéo và nếp gấp ấy chính là hai góc đối đỉnh và tia phân giác. Bài này giúp bạn nhận ra chúng và tính góc nhanh, không cần thước đo.',
    theory:
      'HAI GÓC KỀ NHAU VÀ HAI GÓC KỀ BÙ\n' +
      '— Hai góc kề nhau: chung đỉnh, chung một cạnh, và hai cạnh còn lại nằm về hai phía khác nhau của cạnh chung.\n' +
      '— Hai góc kề bù: là hai góc kề nhau mà hai cạnh không chung là hai tia đối nhau. Khi đó hai góc tạo thành một góc bẹt nên tổng của chúng bằng 180°.\n' +
      'Ví dụ: A, O, B thẳng hàng với O nằm giữa, tia OC nằm ngoài đường thẳng AB. Hai góc AOC và COB là hai góc kề bù, nên ∠AOC + ∠COB = 180°.\n\n' +
      'HAI GÓC ĐỐI ĐỈNH\n' +
      'Hai đường thẳng AB và CD cắt nhau tại O (O nằm giữa A, B và giữa C, D) tạo ra bốn góc nhỏ hơn 180°. Góc AOC và góc BOD là hai góc đối đỉnh: mỗi cạnh của góc này là tia đối của một cạnh của góc kia. ' +
      'Tương tự, góc COB và góc DOA là một cặp đối đỉnh nữa.\n' +
      'Tính chất: hai góc đối đỉnh thì bằng nhau. Vì sao? Cả ∠AOC và ∠BOD đều kề bù với ∠COB, nên ∠AOC = 180° − ∠COB = ∠BOD.\n\n' +
      'TIA PHÂN GIÁC CỦA MỘT GÓC\n' +
      'Tia Ot nằm giữa hai cạnh Ox, Oy của góc xOy và tạo ra hai góc bằng nhau (∠xOt = ∠tOy) gọi là tia phân giác của góc xOy. ' +
      'Khi đó mỗi góc nhỏ bằng một nửa góc ban đầu: ∠xOt = ∠tOy = ∠xOy : 2. Mỗi góc chỉ có đúng một tia phân giác.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng hai góc kề bù thì bằng nhau. Chúng chỉ có tổng bằng 180° (bằng nhau khi cùng bằng 90°).\n' +
      '— Cho rằng mọi cặp góc có tổng 180° đều là kề bù. Hai góc bù nhau chưa chắc có chung đỉnh hay kề nhau.\n' +
      '— Cho rằng hai góc bằng nhau thì đối đỉnh. Điều ngược lại không đúng: hai góc bằng nhau có thể nằm ở những chỗ rất xa nhau.\n' +
      '— Coi mọi tia nằm giữa hai cạnh là tia phân giác. Phải chia góc thành hai phần BẰNG nhau.',
    workedExample: {
      problem:
        'Hai đường thẳng AB và CD cắt nhau tại O, biết ∠AOC = 70°. a) Tính ∠COB. b) Tính ∠BOD và ∠AOD. c) Tia OT là tia phân giác của góc COB. Tính ∠COT.',
      steps: [
        'Hai góc AOC và COB kề bù (OA, OB là hai tia đối nhau) nên ∠COB = 180° − 70° = 110°.',
        'Góc BOD đối đỉnh với góc AOC nên ∠BOD = ∠AOC = 70°.',
        'Góc AOD đối đỉnh với góc COB nên ∠AOD = ∠COB = 110°. (Kiểm tra: ∠AOC + ∠COB + ∠BOD + ∠AOD = 70° + 110° + 70° + 110° = 360°.)',
        'OT là phân giác của góc COB nên ∠COT = ∠COB : 2 = 110° : 2 = 55°.',
      ],
      answer: 'a) 110°. b) ∠BOD = 70°, ∠AOD = 110°. c) 55°.',
    },
    checkQuestions: [
      {
        prompt:
          'Chiếc kéo có hai lưỡi bắt chéo nhau ở ốc giữa. Khi hai lưỡi kéo mở ra tạo góc 28° thì hai cán kéo tạo với nhau góc đối đỉnh bao nhiêu độ? (đơn vị độ)',
        answer: { kind: 'numeric', value: 28 },
        explain:
          'Hai cán kéo và hai lưỡi kéo nằm trên hai đường thẳng cắt nhau tại ốc, nên góc giữa hai cán đối đỉnh với góc giữa hai lưỡi, do đó cũng bằng 28°. Lỗi hay gặp là lấy 180° trừ 28° vì nhầm đối đỉnh với kề bù.',
      },
      {
        prompt:
          'Hai góc kề bù, trong đó góc này gấp 4 lần góc kia. Tính số đo góc lớn (đơn vị độ).',
        answer: { kind: 'numeric', value: 144 },
        explain:
          'Gọi góc nhỏ là x thì góc lớn là 4x, và tổng hai góc kề bù là 180°: x + 4x = 180°, suy ra x = 36° và góc lớn là 4 · 36° = 144°. Lỗi hay gặp là quên cộng thành 5 phần và chia 180° cho 4.',
      },
      {
        prompt:
          'Tờ giấy gấp quạt có góc xOy = 84°. Nếp gấp Ot là tia phân giác của góc xOy. Tính ∠xOt (đơn vị độ).',
        answer: { kind: 'numeric', value: 42 },
        explain:
          'Tia phân giác chia góc thành hai góc bằng nhau, mỗi góc bằng một nửa góc ban đầu: 84° : 2 = 42°. Lỗi hay gặp là lấy 180° − 84° vì nhầm với góc kề bù.',
      },
      {
        prompt: 'Phát biểu nào sau đây ĐÚNG?',
        choices: [
          { id: 'a', label: 'Hai góc kề bù luôn bằng nhau.' },
          { id: 'b', label: 'Hai góc đối đỉnh thì bằng nhau.' },
          { id: 'c', label: 'Hai góc có tổng bằng 180° luôn là hai góc kề bù.' },
          { id: 'd', label: 'Hai góc bằng nhau thì luôn đối đỉnh.' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Hai góc đối đỉnh cùng kề bù với một góc thứ ba nên bằng nhau. Các phát biểu kia sai: kề bù chỉ có tổng 180° (không nhất thiết bằng nhau), hai góc bù nhau chưa chắc kề nhau, và hai góc bằng nhau chưa chắc đối đỉnh.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai góc kề bù có tổng bao nhiêu độ?',
        dap: '180°. Chúng kề nhau và hai cạnh không chung là hai tia đối nhau.',
      },
      {
        hoi: 'Tính chất của hai góc đối đỉnh?',
        dap: 'Hai góc đối đỉnh thì bằng nhau (vì cùng kề bù với một góc thứ ba).',
      },
      {
        hoi: 'Tia phân giác của góc xOy là gì?',
        dap: 'Tia Ot nằm giữa hai cạnh và chia góc thành hai góc bằng nhau, mỗi góc bằng một nửa góc xOy.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c3-b2',
    grade: '7',
    chapterNumber: 3,
    chapterTitle: 'Góc và đường thẳng song song',
    lessonNumber: 2,
    title: 'Hai đường thẳng song song và tiên đề Euclid',
    hook:
      'Hai thanh ray tàu hỏa chạy cạnh nhau hàng trăm cây số mà không bao giờ chạm nhau, cũng không xa nhau ra. Các thanh tà vẹt bắt ngang qua hai ray. ' +
      'Người thợ đặt ray làm sao biết hai ray đã song song? Họ không cần đi dọc cả đường: chỉ cần đo vài góc mà thanh tà vẹt tạo ra. Bài này nói rõ cách dùng góc để nhận biết và dùng hai đường song song.',
    theory:
      'HAI ĐƯỜNG THẲNG SONG SONG\n' +
      'Hai đường thẳng a và b (cùng nằm trên một mặt phẳng) không có điểm chung thì song song, viết a // b. Hai đường thẳng phân biệt chỉ có hai khả năng: song song hoặc cắt nhau tại đúng một điểm.\n\n' +
      'CÁC CẶP GÓC KHI MỘT ĐƯỜNG THẲNG CẮT HAI ĐƯỜNG THẲNG\n' +
      'Đường thẳng c cắt đường thẳng a tại A và đường thẳng b tại B. Lấy E và F trên c sao cho thứ tự là E, A, B, F (a ở phía trên, b ở phía dưới). Trên a lấy P (bên trái c) và Q (bên phải c); trên b lấy R (bên trái c) và S (bên phải c). Ta có tám góc; các cặp quan trọng:\n' +
      '— Hai góc so le trong: nằm giữa a và b, ở hai phía khác nhau của c. Ví dụ ∠QAB (đỉnh A, bên phải c) và ∠ABR (đỉnh B, bên trái c).\n' +
      '— Hai góc đồng vị: cùng vị trí ở hai đỉnh. Ví dụ ∠EAQ (phía trên a, bên phải c) và ∠ABS (phía trên b, bên phải c).\n' +
      '— Hai góc trong cùng phía: nằm giữa a và b, cùng một phía của c. Ví dụ ∠QAB và ∠ABS.\n\n' +
      'DẤU HIỆU NHẬN BIẾT HAI ĐƯỜNG THẲNG SONG SONG\n' +
      'Nếu đường thẳng c cắt a và b mà có một cặp góc so le trong bằng nhau (hoặc một cặp góc đồng vị bằng nhau) thì a // b.\n\n' +
      'TIÊN ĐỀ EUCLID\n' +
      'Qua một điểm nằm ngoài đường thẳng a, chỉ có MỘT đường thẳng song song với a. Đây là điều ta công nhận, không chứng minh. Nhờ nó ta chứng minh được ba điều:\n' +
      '— Nếu a // b và c cắt a thì c cũng cắt b.\n' +
      '— Hai đường thẳng cùng song song với đường thẳng thứ ba thì song song với nhau.\n' +
      '— Hai đường thẳng phân biệt cùng vuông góc với một đường thẳng thứ ba thì song song với nhau.\n\n' +
      'TÍNH CHẤT HAI ĐƯỜNG THẲNG SONG SONG\n' +
      'Nếu đường thẳng c cắt hai đường thẳng song song a và b thì: hai góc so le trong bằng nhau; hai góc đồng vị bằng nhau; hai góc trong cùng phía bù nhau (tổng 180°). ' +
      'Vì sao trong cùng phía bù nhau? Vì góc trong cùng phía bù với góc kề bù của nó, mà góc kề bù đó lại bằng góc đồng vị nên bằng góc kia.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng tính chất “so le trong bằng nhau” khi CHƯA biết hai đường song song. Muốn chứng minh song song thì dùng dấu hiệu; đã biết song song thì dùng tính chất.\n' +
      '— Nhầm góc so le trong với góc trong cùng phía: so le trong khác phía của c, trong cùng phía thì cùng phía.\n' +
      '— Cho rằng góc trong cùng phía bằng nhau; thật ra chúng có TỔNG bằng 180°.',
    workedExample: {
      problem:
        'Đường thẳng c cắt a tại A và b tại B (theo cách đặt tên ở phần lý thuyết). Biết ∠EAQ = 120° và ∠ABS = 120°. a) Hai đường thẳng a và b có song song không? b) Tính ∠QAB và kiểm tra ∠QAB + ∠ABS.',
      steps: [
        '∠EAQ và ∠ABS là một cặp góc đồng vị (cùng phía trên đường thẳng, cùng bên phải c) và bằng nhau (cùng 120°).',
        'Theo dấu hiệu nhận biết, hai góc đồng vị bằng nhau thì hai đường thẳng song song. Vậy a // b.',
        'E, A, B thẳng hàng với A nằm giữa nên AE và AB là hai tia đối nhau, do đó ∠EAQ và ∠QAB kề bù: ∠QAB = 180° − 120° = 60°.',
        '∠QAB và ∠ABS là hai góc trong cùng phía; tổng 60° + 120° = 180°, đúng với tính chất của hai đường thẳng song song.',
      ],
      answer: 'a) Có, a // b. b) ∠QAB = 60°; tổng hai góc trong cùng phía bằng 180°.',
    },
    checkQuestions: [
      {
        prompt:
          'Cho đường thẳng d và điểm M nằm ngoài d. Theo tiên đề Euclid, qua M có bao nhiêu đường thẳng song song với d?',
        answer: { kind: 'numeric', value: 1 },
        explain:
          'Tiên đề Euclid khẳng định qua một điểm ngoài đường thẳng chỉ có đúng một đường thẳng song song với nó. Lỗi hay gặp là nghĩ có vô số đường thẳng qua M (đúng với đường thẳng bất kỳ đi qua M) mà quên điều kiện phải song song.',
      },
      {
        prompt:
          'Hai đường thẳng a // b bị đường thẳng c cắt. Một góc trong cùng phía có số đo 112°. Tính góc trong cùng phía còn lại (đơn vị độ).',
        answer: { kind: 'numeric', value: 68 },
        explain:
          'Khi hai đường thẳng song song, hai góc trong cùng phía bù nhau nên góc còn lại là 180° − 112° = 68°. Lỗi hay gặp là cho rằng hai góc đó bằng nhau và đáp 112°, vì nhầm với góc so le trong.',
      },
      {
        prompt:
          'Hàng rào có hai thanh ngang song song, một thanh chéo cắt cả hai. Ở thanh ngang trên, thanh chéo tạo góc 50° nằm giữa hai thanh ngang và ở bên trái thanh chéo. Góc nằm giữa hai thanh ngang, bên phải thanh chéo, ở chỗ thanh ngang dưới (so le trong với góc 50°) bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 50 },
        explain:
          'Hai thanh ngang song song nên hai góc so le trong bằng nhau, vậy góc cần tìm là 50°. Lỗi hay gặp là đáp 130° vì nhầm với góc trong cùng phía (bù nhau).',
      },
      {
        prompt:
          'Đường thẳng c cắt hai đường thẳng a và b. Điều kiện nào sau đây giúp kết luận a // b?',
        choices: [
          { id: 'a', label: 'Có một cặp góc so le trong bằng nhau.' },
          { id: 'b', label: 'Có hai góc kề bù với nhau.' },
          { id: 'c', label: 'Có hai góc đối đỉnh bằng nhau.' },
          { id: 'd', label: 'Hai đường thẳng a và b cùng cắt c.' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Đó chính là dấu hiệu nhận biết hai đường thẳng song song. Các điều kiện còn lại đều luôn xảy ra dù a, b có song song hay không (kề bù, đối đỉnh, cùng cắt c), nên không dùng để kết luận được.',
      },
    ],
    srsCards: [
      {
        hoi: 'Dấu hiệu nhận biết hai đường thẳng song song bằng góc?',
        dap: 'Một đường thẳng cắt hai đường thẳng tạo một cặp góc so le trong bằng nhau (hoặc một cặp góc đồng vị bằng nhau) thì hai đường thẳng đó song song.',
      },
      {
        hoi: 'Phát biểu tiên đề Euclid.',
        dap: 'Qua một điểm nằm ngoài một đường thẳng, chỉ có một đường thẳng song song với đường thẳng đó.',
      },
      {
        hoi: 'Khi a // b và c cắt a, b thì các cặp góc có quan hệ gì?',
        dap: 'Hai góc so le trong bằng nhau, hai góc đồng vị bằng nhau, hai góc trong cùng phía bù nhau (tổng 180°).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c3-b3',
    grade: '7',
    chapterNumber: 3,
    chapterTitle: 'Góc và đường thẳng song song',
    lessonNumber: 3,
    title: 'Định lí và chứng minh định lí',
    hook:
      'Bạn nói: “Mọi bạn lớp mình đều thích đá bóng.” Bạn khác chỉ cần chỉ ra một bạn không thích là bác bỏ được ngay. ' +
      'Nhưng muốn khẳng định một điều đúng với mọi trường hợp thì không thể thử vài lần rồi tin. ' +
      'Toán học dùng “chứng minh”: đi từng bước chắc chắn từ điều đã biết. Bài này học cách phát biểu định lí và chứng minh một định lí đơn giản.',
    theory:
      'ĐỊNH LÍ\n' +
      'Định lí là một khẳng định đã được chứng minh là đúng. Ví dụ các điều bạn đã biết: “Hai góc đối đỉnh thì bằng nhau”, “Hai đường thẳng cùng song song với đường thẳng thứ ba thì song song với nhau”.\n\n' +
      'GIẢ THIẾT VÀ KẾT LUẬN\n' +
      'Nhiều định lí có dạng “Nếu A thì B”. Phần A là GIẢ THIẾT (điều đã cho); phần B là KẾT LUẬN (điều cần chứng minh). ' +
      'Ví dụ: “Nếu hai góc đối đỉnh thì hai góc đó bằng nhau”. Giả thiết: hai góc đối đỉnh. Kết luận: hai góc bằng nhau. ' +
      'Khi viết bài, ta thường vẽ hình rồi ghi “GT” (giả thiết) và “KL” (kết luận) bằng ký hiệu.\n\n' +
      'CHỨNG MINH MỘT ĐỊNH LÍ\n' +
      'Chứng minh là một chuỗi suy luận, mỗi bước đều có căn cứ: giả thiết, định nghĩa, tính chất hoặc định lí đã học. Quy trình gợi ý:\n' +
      '— Vẽ hình, viết GT và KL.\n' +
      '— Tìm từ KL lùi về: muốn có kết luận này thì cần điều gì? (dấu hiệu nhận biết nào dùng được?)\n' +
      '— Viết bài từ GT đi tới KL, ghi rõ căn cứ ở mỗi bước.\n\n' +
      'PHẢN VÍ DỤ\n' +
      'Muốn chứng tỏ một khẳng định là SAI, chỉ cần một ví dụ mà khẳng định không đúng, gọi là phản ví dụ. ' +
      'Chẳng hạn khẳng định “hai góc bằng nhau thì đối đỉnh” là sai vì hai góc cùng 40° nằm ở hai nơi xa nhau không đối đỉnh.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Thử vài ví dụ đúng rồi cho là đã chứng minh. Ví dụ đúng không thay thế được chứng minh.\n' +
      '— Nhầm giả thiết với kết luận. Đảo giả thiết và kết luận cho một khẳng định khác, có thể sai (hai góc bằng nhau chưa chắc đối đỉnh).\n' +
      '— Dùng chính điều cần chứng minh làm căn cứ.',
    workedExample: {
      problem:
        'Chứng minh định lí: “Hai đường thẳng phân biệt a và b cùng vuông góc với đường thẳng c thì song song với nhau.” (Gọi A, B là giao điểm của c với a, b; E và F trên c sao cho E, A, B, F theo thứ tự; Q thuộc a và S thuộc b nằm cùng bên phải c.)',
      steps: [
        'GT: a ⊥ c tại A, b ⊥ c tại B. KL: a // b.',
        'Vì a ⊥ c tại A nên ∠EAQ = 90°. Vì b ⊥ c tại B nên ∠ABS = 90°.',
        '∠EAQ và ∠ABS là hai góc đồng vị (c cắt a, b; cùng phía trên mỗi đường thẳng, cùng bên phải c) và cùng bằng 90°.',
        'Theo dấu hiệu nhận biết hai đường thẳng song song (hai góc đồng vị bằng nhau), suy ra a // b. Điều phải chứng minh.',
      ],
      answer: 'a // b (căn cứ: hai góc đồng vị cùng bằng 90°).',
    },
    checkQuestions: [
      {
        prompt: 'Định lí “Nếu hai góc đối đỉnh thì hai góc đó bằng nhau”. Phần nào là giả thiết?',
        choices: [
          { id: 'a', label: 'Hai góc đó bằng nhau.' },
          { id: 'b', label: 'Hai góc đối đỉnh.' },
          { id: 'c', label: 'Hai góc đó kề bù.' },
          { id: 'd', label: 'Cả hai phần đều là giả thiết.' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Giả thiết là điều đã cho, đứng sau chữ “Nếu”: hai góc đối đỉnh. Điều cần chứng minh “hai góc bằng nhau” mới là kết luận. Lỗi hay gặp là đảo hai phần và chứng minh nhầm khẳng định đảo.',
      },
      {
        prompt:
          'Muốn chứng tỏ khẳng định “Hai góc có tổng bằng 180° thì kề nhau” là SAI, ta cần làm gì?',
        choices: [
          { id: 'a', label: 'Chỉ ra một cặp góc có tổng 180° nhưng không kề nhau.' },
          { id: 'b', label: 'Tìm thật nhiều cặp góc có tổng 180° và kề nhau.' },
          { id: 'c', label: 'Đo bằng thước đo góc nhiều lần.' },
          { id: 'd', label: 'Không thể chứng tỏ được.' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Chỉ cần một phản ví dụ là đủ bác bỏ: hai góc 100° và 80° ở hai chỗ xa nhau có tổng 180° nhưng không kề nhau. Nhiều ví dụ đúng không chứng minh được điều gì, đó là lỗi hay gặp khi “kiểm tra bằng thử”.',
      },
      {
        prompt:
          'Hai thanh ray tàu song song. Một thanh tà vẹt vuông góc với ray thứ nhất thì vuông góc với ray thứ hai (một định lí). Hỏi thanh tà vẹt tạo với ray thứ hai góc bao nhiêu độ?',
        answer: { kind: 'numeric', value: 90 },
        explain:
          'Đường thẳng vuông góc với một trong hai đường thẳng song song thì vuông góc với đường kia, vì hai góc đồng vị bằng nhau, nên góc tạo bởi tà vẹt và ray thứ hai là 90°. Lỗi hay gặp là nghĩ góc thay đổi khi sang ray khác.',
      },
      {
        prompt:
          'Trong chứng minh “a ⊥ c và b ⊥ c thì a // b”, ta kết luận a // b dựa vào căn cứ nào?',
        choices: [
          { id: 'a', label: 'Dấu hiệu hai góc đồng vị bằng nhau.' },
          { id: 'b', label: 'Tính chất tia phân giác của một góc.' },
          { id: 'c', label: 'Tính chất hai góc đối đỉnh bằng nhau.' },
          { id: 'd', label: 'Tính chất hai góc trong cùng phía bù nhau.' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hai góc tại giao điểm của c với a và b đều bằng 90° nên là một cặp góc đồng vị bằng nhau, từ đó suy ra a // b theo dấu hiệu nhận biết. Lỗi hay gặp là dùng tính chất trong cùng phía bù nhau, vốn chỉ dùng khi ĐÃ biết hai đường song song.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định lí dạng “Nếu A thì B” gồm những phần nào?',
        dap: 'A là giả thiết (điều đã cho), B là kết luận (điều cần chứng minh).',
      },
      {
        hoi: 'Làm sao chứng tỏ một khẳng định là sai?',
        dap: 'Chỉ ra một phản ví dụ: một trường hợp thoả giả thiết nhưng không có kết luận.',
      },
      {
        hoi: 'Hai đường thẳng cùng vuông góc với đường thứ ba thì thế nào?',
        dap: 'Chúng song song với nhau (hai góc đồng vị cùng bằng 90°).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
