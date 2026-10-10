// lessons/toan6c5.ts — Toán 6, Chương 5: Tính đối xứng của hình phẳng trong tự nhiên.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C5_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c5-b1',
    grade: '6',
    chapterNumber: 5,
    chapterTitle: 'Tính đối xứng của hình phẳng trong tự nhiên',
    lessonNumber: 1,
    title: 'Hình có trục đối xứng',
    hook:
      'Gấp đôi một tờ giấy, cắt một nửa hình trái tim rồi mở ra: bạn được cả trái tim hai nửa y hệt nhau. ' +
      'Cánh bướm, chiếc lá, quốc kỳ Việt Nam, chữ A trên biển hiệu… đều có chung một “bí mật” như vậy. ' +
      'Đường gấp giữa hai nửa ấy chính là trục đối xứng. Bài này giúp bạn tìm trục đối xứng và đếm xem mỗi hình có bao nhiêu trục.',
    theory:
      'TRỤC ĐỐI XỨNG LÀ GÌ\n' +
      'Một hình có trục đối xứng khi tồn tại một đường thẳng d chia hình thành hai phần sao cho gấp hình theo đường d, ' +
      'hai phần chồng khít lên nhau. Đường thẳng d gọi là trục đối xứng của hình. Nói cách khác, hai nửa là ảnh phản chiếu của nhau qua d, ' +
      'giống như nhìn một vật qua gương đặt dọc theo d.\n\n' +
      'CÁCH KIỂM TRA BẰNG GẤP GIẤY\n' +
      'Vẽ hình lên giấy, thử gấp theo một đường. Nếu hai nửa trùng khít (không thừa, không thiếu một mảnh nào) thì đường gấp là trục đối xứng. ' +
      'Không thể kết luận chỉ bằng mắt, vì nhiều hình nhìn giống đối xứng nhưng thật ra không.\n\n' +
      'SỐ TRỤC ĐỐI XỨNG CỦA CÁC HÌNH QUEN THUỘC\n' +
      '— Tam giác đều: 3 trục (mỗi trục đi qua một đỉnh và trung điểm cạnh đối diện).\n' +
      '— Hình vuông: 4 trục (hai đường chéo và hai đường nối trung điểm các cạnh đối).\n' +
      '— Hình chữ nhật (không phải hình vuông): 2 trục (hai đường nối trung điểm các cạnh đối). Đường chéo KHÔNG phải là trục.\n' +
      '— Hình thoi (không phải hình vuông): 2 trục, chính là hai đường chéo.\n' +
      '— Hình thang cân: 1 trục (đường nối trung điểm hai đáy).\n' +
      '— Lục giác đều: 6 trục.\n' +
      '— Đường tròn: vô số trục, mỗi đường thẳng đi qua tâm đều là trục.\n' +
      '— Hình bình hành (không phải chữ nhật hay thoi): KHÔNG có trục đối xứng.\n' +
      'Quy luật: đa giác đều n cạnh có đúng n trục đối xứng.\n\n' +
      'TRONG CHỮ CÁI, LOGO VÀ THIÊN NHIÊN\n' +
      '— Chữ cái in hoa (phông không chân) có trục dọc: A, M, T, U, V, W, Y. Có trục ngang: B, C, D, E, K. ' +
      'Có cả hai trục: H, I, O, X. Không có trục: F, G, J, L, N, P, Q, R, S, Z.\n' +
      '— Ngôi sao năm cánh trên quốc kỳ có 5 trục. Cả lá cờ hình chữ nhật có ngôi sao ở giữa chỉ có 1 trục: đường thẳng đứng đi qua đỉnh sao.\n' +
      '— Cánh bướm, lá cây, hoa mai năm cánh đều có trục đối xứng (hoa mai có 5 trục).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng đường chéo hình chữ nhật là trục đối xứng. Gấp theo đường chéo, hai nửa không trùng khít (trừ hình vuông).\n' +
      '— Cho rằng hình bình hành có trục là hai đường chéo. Hai tam giác hai bên đường chéo bằng nhau nhưng không gấp trùng được.\n' +
      '— Quên rằng hình có thể có nhiều trục; đếm thiếu.',
    workedExample: {
      problem:
        'Cho các hình: tam giác đều, hình chữ nhật (không phải hình vuông), hình bình hành (không phải chữ nhật hay thoi). Hãy nêu số trục đối xứng của từng hình.',
      steps: [
        'Tam giác đều: ba đường, mỗi đường đi qua một đỉnh và trung điểm cạnh đối diện, gấp theo đường nào hai nửa cũng trùng khít, nên có 3 trục.',
        'Hình chữ nhật: gấp đôi theo đường nối trung điểm hai cạnh dài, hoặc theo đường nối trung điểm hai cạnh ngắn, đều trùng khít; gấp theo đường chéo thì không. Vậy có 2 trục.',
        'Hình bình hành: không có cách gấp nào làm hai nửa trùng khít (gấp theo đường chéo thì hai phần lệch nhau). Vậy không có trục đối xứng.',
      ],
      answer: 'Tam giác đều có 3 trục; hình chữ nhật có 2 trục; hình bình hành không có trục.',
    },
    checkQuestions: [
      {
        prompt: 'Hình chữ nhật (không phải hình vuông) có bao nhiêu trục đối xứng?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Chỉ có hai trục: đường nối trung điểm hai cạnh dài và đường nối trung điểm hai cạnh ngắn. Lỗi hay gặp là tính cả hai đường chéo và ra 4 trục, trong khi gấp theo đường chéo không trùng khít.',
      },
      {
        prompt: 'Trong các chữ in hoa sau (phông chữ không chân), chữ nào KHÔNG có trục đối xứng?',
        choices: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'M' },
          { id: 'c', label: 'R' },
          { id: 'd', label: 'T' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'A, M, T đều có trục dọc ở giữa, còn R có phần bụng chỉ ở một bên nên gấp đôi không trùng khít. Lỗi hay gặp là thấy chữ R “cân đối” nên tưởng có trục.',
      },
      {
        prompt: 'Mỗi ô trong tổ ong là một hình lục giác đều. Mỗi ô có bao nhiêu trục đối xứng?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Đa giác đều n cạnh có n trục đối xứng, nên lục giác đều có 6 trục: ba đường chéo chính và ba đường nối trung điểm các cạnh đối. Lỗi hay gặp là chỉ đếm 3 đường chéo chính.',
      },
      {
        prompt: 'Hình bình hành (không phải hình chữ nhật hay hình thoi) có trục đối xứng không?',
        choices: [
          { id: 'a', label: 'Có đúng 1 trục' },
          { id: 'b', label: 'Có đúng 2 trục là hai đường chéo' },
          { id: 'c', label: 'Không có trục đối xứng' },
          { id: 'd', label: 'Có 4 trục' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Hình bình hành bị “nghiêng” nên không cách gấp nào làm hai nửa trùng khít. Lỗi hay gặp là cho rằng hai đường chéo là trục, vì chúng chỉ chia hình thành hai tam giác bằng nhau chứ không phản chiếu nhau.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khi nào một hình có trục đối xứng?',
        dap: 'Khi có một đường thẳng mà gấp hình theo đường đó, hai phần chồng khít lên nhau.',
      },
      {
        hoi: 'Số trục đối xứng của tam giác đều, hình vuông, hình chữ nhật, lục giác đều?',
        dap: '3 trục, 4 trục, 2 trục, 6 trục.',
      },
      {
        hoi: 'Đường tròn và hình bình hành có bao nhiêu trục đối xứng?',
        dap: 'Đường tròn có vô số trục (mọi đường kính); hình bình hành thông thường không có trục.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c5-b2',
    grade: '6',
    chapterNumber: 5,
    chapterTitle: 'Tính đối xứng của hình phẳng trong tự nhiên',
    lessonNumber: 2,
    title: 'Hình có tâm đối xứng',
    hook:
      'Chiếc chong chóng bốn cánh quay nửa vòng thì trông y như lúc đầu. Mặt trống đồng Đông Sơn với ngôi sao nhiều tia ở giữa, ' +
      'những hoa văn trang trí trên cổng chùa, hay chữ S, N, Z trên biển hiệu cũng có tính chất lạ ấy. ' +
      'Đây là kiểu đối xứng khác với gập đôi: ta xoay hình quanh một điểm. Bài này giúp bạn tìm tâm đối xứng.',
    theory:
      'TÂM ĐỐI XỨNG LÀ GÌ\n' +
      'Một hình có tâm đối xứng O khi nếu quay hình nửa vòng (180°) quanh điểm O thì hình trùng khít với chính nó. ' +
      'Điểm O gọi là tâm đối xứng. Khi đó mỗi điểm A của hình đều có một điểm A′ cũng thuộc hình sao cho O là trung điểm của đoạn AA′. ' +
      'Vì thế tâm đối xứng luôn nằm “chính giữa” hình.\n\n' +
      'CÁCH KIỂM TRA\n' +
      'Đặt một tờ giấy bóng kính lên hình, ghim đinh tại điểm O rồi xoay nửa vòng. Nếu hình trùng khít với hình gốc thì O là tâm đối xứng. ' +
      'Cách khác: kiểm tra từng đỉnh, đỉnh đối diện qua O phải là một đỉnh của hình.\n\n' +
      'CÁC HÌNH QUEN THUỘC\n' +
      '— Hình bình hành: CÓ tâm đối xứng là giao điểm hai đường chéo, nhưng KHÔNG có trục đối xứng (nếu không phải chữ nhật hay thoi).\n' +
      '— Hình chữ nhật, hình thoi, hình vuông: có tâm đối xứng là giao điểm hai đường chéo.\n' +
      '— Lục giác đều: có tâm đối xứng là tâm O (giao ba đường chéo chính).\n' +
      '— Đường tròn: có tâm đối xứng là tâm của đường tròn.\n' +
      '— Tam giác đều: KHÔNG có tâm đối xứng (dù có 3 trục).\n' +
      '— Hình thang cân: KHÔNG có tâm đối xứng (dù có 1 trục).\n' +
      'Chữ cái in hoa có tâm đối xứng: H, I, N, O, S, X, Z. Không có: A, E, M, T…\n' +
      'Chong chóng bốn cánh đều có tâm; chong chóng ba cánh thì không, vì quay nửa vòng cánh không trùng cánh.\n\n' +
      'TRỤC VÀ TÂM — HAI CHUYỆN KHÁC NHAU\n' +
      'Có hình chỉ có trục (tam giác đều, hình thang cân), có hình chỉ có tâm (hình bình hành, chữ S), có hình có cả hai (hình chữ nhật, hình vuông, hình tròn) ' +
      'và có hình không có gì. Không được suy từ cái này sang cái kia.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nghĩ “đối xứng thì cái nào cũng có cả trục lẫn tâm”.\n' +
      '— Cho rằng tâm đối xứng của tam giác là trọng tâm hay tâm đường tròn; xoay nửa vòng tam giác không trùng chính nó.\n' +
      '— Nhầm xoay một góc 180° với lật gấp (lật là đối xứng trục).',
    workedExample: {
      problem:
        'Cho hình bình hành ABCD, hai đường chéo cắt nhau tại O. Biết AC = 14 cm. a) Hình có tâm đối xứng không? Là điểm nào? b) Điểm đối xứng của A qua O là điểm nào, và OA bằng bao nhiêu?',
      steps: [
        'Xoay hình bình hành nửa vòng quanh giao điểm O của hai đường chéo thì A trùng C, B trùng D, nên hình trùng khít với chính nó. Vậy O là tâm đối xứng.',
        'Điểm đối xứng của A qua O là C, vì A và C là hai đầu một đường chéo.',
        'O là trung điểm của AC nên OA = AC : 2 = 14 : 2 = 7 cm.',
      ],
      answer: 'Có, tâm đối xứng là O (giao hai đường chéo); đối xứng của A là C; OA = 7 cm.',
    },
    checkQuestions: [
      {
        prompt: 'Hình nào sau đây có tâm đối xứng?',
        choices: [
          { id: 'a', label: 'Tam giác đều' },
          { id: 'b', label: 'Hình thang cân' },
          { id: 'c', label: 'Hình bình hành' },
          { id: 'd', label: 'Chữ cái T in hoa' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Hình bình hành có tâm đối xứng là giao điểm hai đường chéo. Tam giác đều, hình thang cân và chữ T chỉ có trục đối xứng, không có tâm. Lỗi hay gặp là tưởng có trục thì có tâm.',
      },
      {
        prompt:
          'Trong dãy chữ in hoa H, A, N, E, S, Z, M (phông chữ không chân), có bao nhiêu chữ có tâm đối xứng?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Chữ H, N, S, Z quay nửa vòng thì trùng chính nó; còn A, E, M thì không. Vậy có 4 chữ. Lỗi hay gặp là bỏ sót N, S, Z vì chúng không có trục đối xứng nhưng vẫn có tâm.',
      },
      {
        prompt:
          'Hình chữ nhật ABCD có tâm đối xứng O. Biết đường chéo AC = 16 cm. Tính độ dài OA (đơn vị cm).',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'Điểm đối xứng của A qua O là C nên O là trung điểm của AC, do đó OA = 16 : 2 = 8 cm. Lỗi hay gặp là lấy OA = AC = 16 cm vì quên rằng O ở chính giữa.',
      },
      {
        prompt: 'Hình nào có trục đối xứng nhưng KHÔNG có tâm đối xứng?',
        choices: [
          { id: 'a', label: 'Hình vuông' },
          { id: 'b', label: 'Hình tròn' },
          { id: 'c', label: 'Tam giác đều' },
          { id: 'd', label: 'Hình bình hành' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Tam giác đều có 3 trục nhưng quay nửa vòng không trùng chính nó. Hình vuông và hình tròn có cả trục lẫn tâm; hình bình hành có tâm nhưng không có trục, nên đảo ngược điều kiện là lỗi hay gặp.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khi nào một hình có tâm đối xứng O?',
        dap: 'Khi quay hình nửa vòng (180°) quanh O thì hình trùng khít với chính nó.',
      },
      {
        hoi: 'Hình bình hành có trục đối xứng và tâm đối xứng không?',
        dap: 'Có tâm đối xứng (giao hai đường chéo) nhưng không có trục đối xứng.',
      },
      {
        hoi: 'Tam giác đều có tâm đối xứng không?',
        dap: 'Không. Tam giác đều có 3 trục nhưng quay nửa vòng không trùng khít với chính nó.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
