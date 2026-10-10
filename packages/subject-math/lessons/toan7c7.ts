// lessons/toan7c7.ts — Toán 7, Chương 7: Biểu thức đại số và đa thức một biến.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C7_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c7-b1',
    grade: '7',
    chapterNumber: 7,
    chapterTitle: 'Biểu thức đại số và đa thức một biến',
    lessonNumber: 1,
    title: 'Biểu thức đại số và đa thức một biến',
    hook:
      'Một hãng taxi tính cước như sau: tiền mở cửa 12 000 đồng, mỗi ki-lô-mét đi thêm 14 000 đồng. ' +
      'Nếu đi x km thì số tiền phải trả là 12 000 + 14 000 · x (đồng). Chỉ cần thay x bằng 3, 5 hay 10, ta có ngay số tiền mà không phải suy nghĩ lại từ đầu. ' +
      'Một "công thức" có chữ đại diện cho số như vậy gọi là biểu thức đại số. Bài này giúp em làm quen với biểu thức đại số và đa thức một biến.',
    theory:
      'BIỂU THỨC ĐẠI SỐ VÀ GIÁ TRỊ CỦA BIỂU THỨC\n' +
      'Biểu thức đại số là biểu thức gồm các số, các chữ (gọi là biến) nối với nhau bằng các phép tính cộng, trừ, nhân, chia, luỹ thừa. ' +
      'Ví dụ: 3x² − 2x + 1; 12 000 + 14 000 · x.\n' +
      'Muốn tính giá trị của biểu thức tại một giá trị của biến, ta thay biến bằng số đó rồi thực hiện các phép tính theo thứ tự. ' +
      'Chú ý đặt số âm trong ngoặc: tại x = −2 thì x² = (−2)² = 4, còn −x² = −4.\n\n' +
      'ĐƠN THỨC MỘT BIẾN\n' +
      'Đơn thức một biến là biểu thức có dạng a · xⁿ, trong đó a là số (hệ số) và n là số tự nhiên. Ví dụ 5x³; −2x; 7 (số 7 cũng là đơn thức, ứng với 7x⁰).\n\n' +
      'ĐA THỨC MỘT BIẾN\n' +
      'Đa thức một biến là tổng của những đơn thức của cùng một biến. Mỗi đơn thức trong tổng gọi là một hạng tử của đa thức. ' +
      'Ví dụ P(x) = x³ + x² − 6x + 4 có bốn hạng tử. Kí hiệu P(x) đọc là "P của x" và nhắc ta rằng đa thức này có biến x.\n' +
      'Thu gọn đa thức: cộng các hạng tử có cùng số mũ của biến. Rồi sắp xếp các hạng tử theo luỹ thừa giảm dần của biến.\n' +
      'Sau khi thu gọn, ta có các khái niệm:\n' +
      '— Bậc của đa thức: số mũ lớn nhất của biến. P(x) = x³ + x² − 6x + 4 có bậc 3.\n' +
      '— Hệ số cao nhất: hệ số của hạng tử có bậc cao nhất (ở P(x) là 1).\n' +
      '— Hệ số tự do: hạng tử không chứa biến (ở P(x) là 4).\n' +
      'VÌ SAO phải thu gọn trước khi tìm bậc? Vì nếu chưa gộp, hạng tử bậc cao có thể bị triệt tiêu: 3x⁵ − 3x⁵ = 0 nên không còn x⁵.\n\n' +
      'GIÁ TRỊ VÀ NGHIỆM CỦA ĐA THỨC\n' +
      'Giá trị của P(x) tại x = a kí hiệu là P(a), tính bằng cách thay x bằng a. ' +
      'Nếu P(a) = 0 thì a gọi là một nghiệm của đa thức P(x). ' +
      'Ví dụ P(x) = x³ + x² − 6x + 4 có P(1) = 1 + 1 − 6 + 4 = 0 nên x = 1 là một nghiệm.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Tìm bậc khi chưa thu gọn đa thức.\n' +
      '— Lấy hệ số của hạng tử đầu tiên (theo cách viết) làm hệ số cao nhất; phải sắp xếp trước rồi mới đọc.\n' +
      '— Tính sai dấu khi thay số âm vào luỹ thừa: (−2)² = 4 nhưng −2² = −4.\n' +
      '— Nghĩ rằng đa thức chỉ có một nghiệm: một đa thức có thể có nhiều nghiệm hoặc không có nghiệm nào.',
    workedExample: {
      problem:
        'Cho P(x) = 2x² − 6x + 4 + x³ − x². Hãy thu gọn và sắp xếp P(x) theo luỹ thừa giảm dần của x; ' +
        'cho biết bậc, hệ số cao nhất, hệ số tự do; tính P(2) và kiểm tra x = 1 có phải là nghiệm không.',
      steps: [
        'Gộp các hạng tử cùng bậc: 2x² − x² = x².',
        'Sắp xếp giảm dần: P(x) = x³ + x² − 6x + 4.',
        'Bậc của P(x) là 3 (số mũ lớn nhất). Hệ số cao nhất là 1. Hệ số tự do là 4.',
        'P(2) = 2³ + 2² − 6 · 2 + 4 = 8 + 4 − 12 + 4 = 4.',
        'P(1) = 1³ + 1² − 6 · 1 + 4 = 1 + 1 − 6 + 4 = 0.',
        'Vì P(1) = 0 nên x = 1 là một nghiệm của P(x).',
      ],
      answer:
        'P(x) = x³ + x² − 6x + 4, bậc 3, hệ số cao nhất 1, hệ số tự do 4; P(2) = 4; x = 1 là nghiệm vì P(1) = 0.',
    },
    checkQuestions: [
      {
        prompt:
          'Một hãng taxi tính cước: mở cửa 12 000 đồng và 14 000 đồng cho mỗi km. Số tiền khi đi x km là 12 000 + 14 000 · x. ' +
          'Tính số tiền phải trả khi đi 6 km (đơn vị đồng).',
        answer: { kind: 'numeric', value: 96000 },
        explain:
          'Thay x = 6 vào biểu thức: 12 000 + 14 000 · 6 = 12 000 + 84 000 = 96 000 (đồng). ' +
          'Lỗi hay gặp là cộng 12 000 + 14 000 trước rồi mới nhân với 6, vì quên rằng phép nhân được làm trước phép cộng.',
      },
      {
        prompt: 'Cho R(x) = −x² + 4x³ − 7 + 2x. Hệ số cao nhất của R(x) bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Sắp xếp theo luỹ thừa giảm dần: R(x) = 4x³ − x² + 2x − 7. Hạng tử bậc cao nhất là 4x³ nên hệ số cao nhất là 4. ' +
          'Lỗi hay gặp là lấy hệ số của hạng tử viết đầu tiên (−1) mà chưa sắp xếp.',
      },
      {
        prompt:
          'Cho Q(x) = 3x⁵ − 2x² + 7 − 3x⁵ + x³. Sau khi thu gọn, bậc của đa thức Q(x) bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Gộp: 3x⁵ − 3x⁵ = 0 nên Q(x) = x³ − 2x² + 7, có bậc 3. ' +
          'Lỗi hay gặp là kết luận bậc 5 vì thấy luỹ thừa lớn nhất khi chưa thu gọn, dù hạng tử đó đã triệt tiêu.',
      },
      {
        prompt: 'Số nào sau đây là nghiệm của đa thức P(x) = x² − 5x + 6?',
        choices: [
          { id: 'a', label: 'x = 1' },
          { id: 'b', label: 'x = 2' },
          { id: 'c', label: 'x = −2' },
          { id: 'd', label: 'x = 4' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'P(2) = 4 − 10 + 6 = 0 nên x = 2 là nghiệm. Các giá trị còn lại: P(1) = 2; P(−2) = 20; P(4) = 2, đều khác 0. ' +
          'Lỗi hay gặp là thay xong nhưng tính sai dấu, hoặc cho rằng nghiệm là số làm cho đa thức dương.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đa thức một biến là gì?',
        dap: 'Là tổng của những đơn thức của cùng một biến; mỗi đơn thức là một hạng tử.',
      },
      {
        hoi: 'Bậc, hệ số cao nhất, hệ số tự do của đa thức là gì?',
        dap: 'Sau khi thu gọn: bậc là số mũ lớn nhất của biến; hệ số cao nhất là hệ số của hạng tử bậc cao nhất; hệ số tự do là hạng tử không chứa biến.',
      },
      {
        hoi: 'Khi nào a là nghiệm của đa thức P(x)?',
        dap: 'Khi P(a) = 0, tức thay x = a thì giá trị của đa thức bằng 0.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c7-b2',
    grade: '7',
    chapterNumber: 7,
    chapterTitle: 'Biểu thức đại số và đa thức một biến',
    lessonNumber: 2,
    title: 'Phép cộng và phép trừ đa thức một biến',
    hook:
      'Quán trà sữa của cô Lan thu tiền bán hàng trong x ngày theo công thức 25x (nghìn đồng) và chi phí là 15x + 300 (nghìn đồng). ' +
      'Muốn biết lãi (lời) của quán, ta lấy tiền thu trừ đi chi phí. Cả hai đều là biểu thức có biến x nên phép trừ này chính là phép trừ hai đa thức. ' +
      'Bài này dạy cách cộng, trừ đa thức một biến sao cho gọn và không sai dấu.',
    theory:
      'CỘNG HAI ĐA THỨC MỘT BIẾN\n' +
      'Muốn cộng hai đa thức, ta viết hai đa thức trong ngoặc nối bằng dấu +, bỏ ngoặc (dấu các hạng tử giữ nguyên), ' +
      'rồi cộng các hạng tử có cùng số mũ của biến. Cuối cùng sắp xếp theo luỹ thừa giảm dần.\n' +
      'Ví dụ: A(x) = 2x² + 3x − 1 và B(x) = x² − 3x + 5. Khi đó\n' +
      'A(x) + B(x) = 2x² + 3x − 1 + x² − 3x + 5 = (2x² + x²) + (3x − 3x) + (−1 + 5) = 3x² + 4.\n' +
      'Hạng tử 3x − 3x = 0 nên không còn xuất hiện trong kết quả.\n\n' +
      'TRỪ HAI ĐA THỨC MỘT BIẾN\n' +
      'Muốn trừ đa thức B(x) khỏi A(x), ta viết A(x) − B(x) với B(x) đặt trong ngoặc. ' +
      'Khi bỏ ngoặc có dấu trừ đứng trước, ta ĐỔI DẤU TẤT CẢ các hạng tử trong ngoặc, rồi mới gộp các hạng tử cùng bậc.\n' +
      'Ví dụ: A(x) − B(x) = (2x² + 3x − 1) − (x² − 3x + 5) = 2x² + 3x − 1 − x² + 3x − 5 = x² + 6x − 6.\n' +
      'VÌ SAO phải đổi dấu cả ngoặc? Vì trừ cho một tổng là trừ cho từng số hạng của tổng đó: a − (b + c) = a − b − c.\n\n' +
      'CÁCH ĐẶT TÍNH THEO CỘT\n' +
      'Có thể xếp hai đa thức thẳng cột theo từng luỹ thừa của biến (hạng tử nào thiếu thì để trống hoặc viết 0), rồi cộng (hay trừ) theo từng cột. ' +
      'Cách này dễ kiểm tra và hạn chế bỏ sót hạng tử.\n\n' +
      'ỨNG DỤNG\n' +
      'Lãi = tiền thu − chi phí. Với thu 25x và chi 15x + 300 (nghìn đồng): lãi = 25x − (15x + 300) = 10x − 300.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Chỉ đổi dấu hạng tử đầu tiên trong ngoặc khi trừ, quên đổi các hạng tử còn lại.\n' +
      '— Cộng nhầm các hạng tử khác bậc với nhau (cộng 3x với 2x²).\n' +
      '— Bỏ sót hạng tử tự do, hoặc để lại hạng tử có hệ số 0 trong kết quả.',
    workedExample: {
      problem:
        'Cho P(x) = 3x³ − 2x² + 5x − 4 và Q(x) = x³ + 4x² − 5x + 7. Hãy tính P(x) + Q(x) và P(x) − Q(x).',
      steps: [
        'Tính tổng: P(x) + Q(x) = 3x³ − 2x² + 5x − 4 + x³ + 4x² − 5x + 7.',
        'Gộp các hạng tử cùng bậc: x³: 3 + 1 = 4; x²: −2 + 4 = 2; x: 5 − 5 = 0; số hạng tự do: −4 + 7 = 3.',
        'Vậy P(x) + Q(x) = 4x³ + 2x² + 3 (hạng tử bậc nhất đã triệt tiêu).',
        'Tính hiệu: P(x) − Q(x) = (3x³ − 2x² + 5x − 4) − (x³ + 4x² − 5x + 7) = 3x³ − 2x² + 5x − 4 − x³ − 4x² + 5x − 7.',
        'Gộp: x³: 3 − 1 = 2; x²: −2 − 4 = −6; x: 5 + 5 = 10; số hạng tự do: −4 − 7 = −11.',
        'Vậy P(x) − Q(x) = 2x³ − 6x² + 10x − 11.',
      ],
      answer: 'P(x) + Q(x) = 4x³ + 2x² + 3 và P(x) − Q(x) = 2x³ − 6x² + 10x − 11.',
    },
    checkQuestions: [
      {
        prompt:
          'Cho A(x) = 2x² + 3x − 1 và B(x) = x² − 3x + 5. Hệ số của x² trong đa thức A(x) + B(x) bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Cộng các hạng tử bậc 2: 2x² + x² = 3x², nên hệ số cần tìm là 3. Chú ý hạng tử bậc nhất 3x − 3x = 0 triệt tiêu. ' +
          'Lỗi hay gặp là nhân hai hệ số 2 · 1 thay vì cộng chúng.',
      },
      {
        prompt: 'Với A(x) và B(x) như trên, hệ số tự do của đa thức A(x) − B(x) bằng bao nhiêu?',
        answer: { kind: 'numeric', value: -6 },
        explain:
          'A(x) − B(x) = x² + 6x − 6, hệ số tự do là −1 − 5 = −6. ' +
          'Lỗi hay gặp là không đổi dấu hạng tử trong ngoặc phía sau dấu trừ, tính thành −1 + 5 = 4.',
      },
      {
        prompt: 'Kết quả của phép tính (x² + 3x) − (2x² − x + 1) là:',
        choices: [
          { id: 'a', label: '−x² + 2x − 1' },
          { id: 'b', label: '−x² + 4x − 1' },
          { id: 'c', label: '−x² + 4x + 1' },
          { id: 'd', label: 'x² + 4x − 1' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Bỏ ngoặc có dấu trừ phải đổi dấu cả ba hạng tử: x² + 3x − 2x² + x − 1 = −x² + 4x − 1. ' +
          'Đáp án −x² + 2x − 1 mắc lỗi quên đổi dấu của −x trong ngoặc; −x² + 4x + 1 quên đổi dấu của số 1.',
      },
      {
        prompt:
          'Quán trà sữa bán x ly một ngày: tiền thu là 25x (nghìn đồng), chi phí là 15x + 300 (nghìn đồng). ' +
          'Lãi = thu − chi. Tính lãi khi x = 60 (đơn vị nghìn đồng).',
        answer: { kind: 'numeric', value: 300 },
        explain:
          'Lãi = 25x − (15x + 300) = 10x − 300. Với x = 60: 10 · 60 − 300 = 300 (nghìn đồng). ' +
          'Lỗi hay gặp là bỏ ngoặc mà không đổi dấu, tính thành 25x − 15x + 300, dẫn tới kết quả 900 sai.',
      },
    ],
    srsCards: [
      {
        hoi: 'Cách cộng hai đa thức một biến?',
        dap: 'Bỏ ngoặc giữ nguyên dấu, cộng các hạng tử có cùng số mũ của biến, rồi sắp xếp theo luỹ thừa giảm dần.',
      },
      {
        hoi: 'Khi bỏ ngoặc có dấu trừ đứng trước cần làm gì?',
        dap: 'Đổi dấu tất cả các hạng tử trong ngoặc, rồi gộp các hạng tử cùng bậc.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c7-b3',
    grade: '7',
    chapterNumber: 7,
    chapterTitle: 'Biểu thức đại số và đa thức một biến',
    lessonNumber: 3,
    title: 'Phép nhân và phép chia đa thức một biến',
    hook:
      'Bác Tư có mảnh vườn hình chữ nhật, chiều dài hơn chiều rộng 4 m. Nếu gọi chiều rộng là x (m) thì chiều dài là x + 4 (m). ' +
      'Bác định mở rộng mỗi chiều thêm 2 m. Diện tích mới là (x + 6) · (x + 2) và đó là tích của hai đa thức. ' +
      'Bài này dạy cách nhân đa thức với đơn thức, nhân hai đa thức, rồi làm phép chia ngược lại để tìm một kích thước khi biết diện tích.',
    theory:
      'NHÂN ĐƠN THỨC VỚI ĐA THỨC\n' +
      'Dùng tính chất phân phối: a · (b + c) = a · b + a · c, và quy tắc nhân luỹ thừa cùng cơ số xᵐ · xⁿ = xᵐ⁺ⁿ (cộng số mũ, không nhân). ' +
      'Ví dụ: 3x² · (2x³ − x + 4) = 3x² · 2x³ − 3x² · x + 3x² · 4 = 6x⁵ − 3x³ + 12x².\n\n' +
      'NHÂN ĐA THỨC VỚI ĐA THỨC\n' +
      'Nhân từng hạng tử của đa thức này với từng hạng tử của đa thức kia, rồi cộng các kết quả và gộp hạng tử cùng bậc.\n' +
      'Ví dụ: (x − 3)(2x + 5) = x · 2x + x · 5 + (−3) · 2x + (−3) · 5 = 2x² + 5x − 6x − 15 = 2x² − x − 15.\n' +
      'VÌ SAO nhân từng cặp? Vì (a + b)(c + d) = a(c + d) + b(c + d), mỗi hạng tử của thừa số thứ nhất phải được nhân với cả thừa số thứ hai.\n\n' +
      'CHIA ĐA THỨC CHO ĐƠN THỨC\n' +
      'Chia từng hạng tử của đa thức cho đơn thức, dùng xᵐ : xⁿ = xᵐ⁻ⁿ (m lớn hơn hoặc bằng n). Ví dụ (6x³ − 4x²) : (2x) = 3x² − 2x.\n\n' +
      'CHIA ĐA THỨC CHO ĐA THỨC MỘT BIẾN\n' +
      'Sắp xếp cả hai đa thức theo luỹ thừa giảm dần rồi làm như phép chia số có nhiều chữ số:\n' +
      '1) Lấy hạng tử bậc cao nhất của số bị chia chia cho hạng tử bậc cao nhất của số chia, được hạng tử đầu của thương.\n' +
      '2) Nhân hạng tử đó với cả số chia, rồi lấy số bị chia trừ đi kết quả (nhớ đổi dấu), được dư thứ nhất.\n' +
      '3) Lặp lại với dư vừa tìm được, cho đến khi dư bằng 0 hoặc bậc của dư nhỏ hơn bậc của số chia.\n' +
      'Kết quả luôn có dạng: số bị chia = số chia · thương + dư.\n' +
      '— Dư bằng 0: phép chia hết. Ví dụ (x² + 5x + 6) : (x + 2) = x + 3.\n' +
      '— Dư khác 0: phép chia có dư. Ví dụ x² + 3x + 5 = (x + 1)(x + 2) + 3, thương x + 2 và dư 3.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhân luỹ thừa mà nhân số mũ (x² · x³ = x⁶): đúng phải là x⁵.\n' +
      '— Khi nhân hai đa thức, bỏ sót một cặp hạng tử, hoặc sai dấu của tích hai số âm.\n' +
      '— Khi chia, quên đổi dấu lúc trừ, hoặc quên viết hạng tử có hệ số 0 (ví dụ thiếu x² trong x³ + x − 2 nên cần xếp cột đủ).\n' +
      '— Dừng chia khi dư vẫn còn bậc lớn hơn hoặc bằng bậc số chia.',
    workedExample: {
      problem:
        'Thực hiện phép chia (2x³ − 5x² + 3x + 4) : (x − 2): tìm thương và dư, rồi kiểm tra lại bằng phép nhân.',
      steps: [
        'Hạng tử đầu: 2x³ : x = 2x². Nhân 2x² · (x − 2) = 2x³ − 4x². Lấy trừ: (2x³ − 5x²) − (2x³ − 4x²) = −x². Hạ 3x: được −x² + 3x.',
        'Hạng tử tiếp: −x² : x = −x. Nhân −x · (x − 2) = −x² + 2x. Lấy trừ: (−x² + 3x) − (−x² + 2x) = x. Hạ 4: được x + 4.',
        'Hạng tử tiếp: x : x = 1. Nhân 1 · (x − 2) = x − 2. Lấy trừ: (x + 4) − (x − 2) = 6.',
        'Dư là 6, bậc 0 nhỏ hơn bậc 1 của số chia nên dừng. Thương là 2x² − x + 1.',
        'Kiểm tra: (x − 2)(2x² − x + 1) + 6 = 2x³ − x² + x − 4x² + 2x − 2 + 6 = 2x³ − 5x² + 3x + 4. Đúng.',
      ],
      answer: 'Thương 2x² − x + 1, dư 6; 2x³ − 5x² + 3x + 4 = (x − 2)(2x² − x + 1) + 6.',
    },
    checkQuestions: [
      {
        prompt: 'Khai triển (x − 3)(2x + 5) = 2x² + bx − 15. Hệ số b của x bằng bao nhiêu?',
        answer: { kind: 'numeric', value: -1 },
        explain:
          'Các hạng tử bậc nhất: x · 5 = 5x và (−3) · 2x = −6x, cộng lại được 5x − 6x = −x nên b = −1. ' +
          'Lỗi hay gặp là quên nhân hạng tử −3 với 2x, hoặc tính sai dấu thành 5x + 6x.',
      },
      {
        prompt: 'Kết quả của 3x² · (2x³ − x + 4) là:',
        choices: [
          { id: 'a', label: '6x⁵ − 3x³ + 12x²' },
          { id: 'b', label: '6x⁶ − 3x³ + 12x²' },
          { id: 'c', label: '5x⁵ − 2x³ + 7x²' },
          { id: 'd', label: '6x⁵ − 3x² + 12x²' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Nhân từng hạng tử: 3x² · 2x³ = 6x⁵ (cộng số mũ 2 + 3), 3x² · (−x) = −3x³, 3x² · 4 = 12x². ' +
          'Đáp án 6x⁶ nhân nhầm số mũ; đáp án 6x⁵ − 3x² + 12x² quên cộng số mũ ở hạng tử thứ hai.',
      },
      {
        prompt:
          'Phép chia (x² + 3x + 5) : (x + 1) có thương là x + 2. Số dư của phép chia này bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          '(x + 1)(x + 2) = x² + 3x + 2. Lấy x² + 3x + 5 trừ đi được dư 5 − 2 = 3. Bậc của dư (0) nhỏ hơn bậc của số chia (1) nên dừng. ' +
          'Lỗi hay gặp là kết luận chia hết ngay khi hai đa thức "trông giống nhau" mà không nhân ngược để kiểm tra.',
      },
      {
        prompt:
          'Một mảnh vườn hình chữ nhật có diện tích x² + 7x + 10 (m²) và chiều rộng x + 2 (m). ' +
          'Chiều dài là kết quả phép chia (x² + 7x + 10) : (x + 2). Khi x = 3, chiều dài bằng bao nhiêu mét?',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'Chia đa thức: (x² + 7x + 10) : (x + 2) = x + 5 (vì (x + 2)(x + 5) = x² + 7x + 10, dư 0). Với x = 3, chiều dài là 3 + 5 = 8 (m). ' +
          'Lỗi hay gặp là chia từng hạng tử riêng lẻ, chẳng hạn lấy x² : x rồi bỏ qua các hạng tử còn lại.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc nhân hai luỹ thừa cùng cơ số xᵐ · xⁿ?',
        dap: 'Giữ nguyên cơ số và cộng số mũ: xᵐ · xⁿ = xᵐ⁺ⁿ (x² · x³ = x⁵).',
      },
      {
        hoi: 'Cách nhân hai đa thức?',
        dap: 'Nhân từng hạng tử của đa thức này với từng hạng tử của đa thức kia, rồi cộng các kết quả và gộp hạng tử cùng bậc.',
      },
      {
        hoi: 'Khi nào dừng phép chia đa thức một biến, và kết quả có dạng gì?',
        dap: 'Dừng khi dư bằng 0 hoặc bậc của dư nhỏ hơn bậc số chia. Số bị chia = số chia · thương + dư.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
