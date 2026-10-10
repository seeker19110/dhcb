// lessons/toan7c1.ts — Toán 7, Chương 1: Số hữu tỉ.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C1_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c1-b1',
    grade: '7',
    chapterNumber: 1,
    chapterTitle: 'Số hữu tỉ',
    lessonNumber: 1,
    title: 'Tập hợp các số hữu tỉ và thứ tự trên trục số',
    hook:
      'Sáng nay trên bản tin thời tiết, Sa Pa là −2,5 °C, Hà Nội là 17 °C, còn Mộc Châu là −1,75 °C. ' +
      'Có số nguyên, số thập phân, số âm lẫn nhau, vậy nơi nào lạnh nhất? Muốn trả lời, em cần một "ngôi nhà chung" ' +
      'cho tất cả các số này và một cách xếp chúng theo thứ tự. Ngôi nhà đó là tập hợp các số hữu tỉ.',
    theory:
      'SỐ HỮU TỈ LÀ GÌ?\n' +
      'Số hữu tỉ là số viết được dưới dạng phân số a/b, với a, b là các số nguyên và b ≠ 0. ' +
      'Tập hợp các số hữu tỉ kí hiệu là ℚ. Ví dụ: 3/4, −5/7, 0, 6 (vì 6 = 6/1), −0,75 (vì −0,75 = −3/4).\n' +
      'VÌ SAO số nguyên và số thập phân hữu hạn cũng là số hữu tỉ? Vì ta luôn viết được chúng thành phân số: ' +
      'số nguyên n = n/1; số thập phân 1,25 = 125/100 = 5/4. Như vậy ℕ ⊂ ℤ ⊂ ℚ (số tự nhiên nằm trong số nguyên, ' +
      'số nguyên nằm trong số hữu tỉ). Một số hữu tỉ có nhiều cách viết phân số, tất cả đều bằng nhau (3/4 = 6/8 = −9/(−12)).\n\n' +
      'BIỂU DIỄN TRÊN TRỤC SỐ\n' +
      'Viết số hữu tỉ với mẫu dương. Muốn biểu diễn a/b (b > 0) ta chia đoạn đơn vị thành b phần bằng nhau, rồi từ gốc 0 ' +
      'đi a phần: sang phải nếu a > 0, sang trái nếu a < 0. Ví dụ −3/4: chia đoạn đơn vị thành 4 phần, đi từ 0 sang trái 3 phần, ' +
      'điểm đó nằm giữa −1 và 0, gần −1 hơn.\n\n' +
      'SỐ ĐỐI\n' +
      'Số đối của a/b là −a/b. Trên trục số, hai số đối nhau nằm ở hai phía của gốc 0 và cách đều 0. Tổng của hai số đối bằng 0; ' +
      'số đối của 0 là 0; số đối của −x là x.\n\n' +
      'SO SÁNH HAI SỐ HỮU TỈ\n' +
      '— Viết hai số dưới dạng phân số cùng mẫu dương rồi so sánh hai tử.\n' +
      '— Số dương > 0 > số âm.\n' +
      '— Trên trục số, số nằm bên trái thì nhỏ hơn số nằm bên phải.\n' +
      'Ví dụ so sánh −2/3 và −3/4: quy đồng mẫu 12 được −8/12 và −9/12. Vì −9 < −8 nên −3/4 < −2/3.\n' +
      'VÌ SAO số âm "trông lớn" lại nhỏ hơn? Đi sang trái so với 0 càng xa thì số càng bé: −9/12 nằm xa 0 hơn −8/12 về phía trái.\n\n' +
      'LỖI HAY GẶP\n' +
      '— So sánh hai số âm như hai số dương: thấy 3/4 lớn hơn 2/3 nên kết luận −3/4 > −2/3. Sai, phải ngược lại.\n' +
      '— Quy đồng khi mẫu còn âm: nên đưa về mẫu dương trước (1/(−2) = −1/2).\n' +
      '— Nhầm số đối với số nghịch đảo: số đối của 3/4 là −3/4, còn 4/3 là số nghịch đảo.\n' +
      '— Nghĩ rằng số thập phân có dấu phẩy thì không phải số hữu tỉ.',
    workedExample: {
      problem:
        'So sánh −5/6 và −7/9. Sau đó viết số đối của mỗi số và cho biết hai số đối đó so sánh với nhau thế nào.',
      steps: [
        'Hai mẫu 6 và 9 đã dương. BCNN(6, 9) = 18.',
        'Quy đồng: −5/6 = (−5·3)/(6·3) = −15/18 và −7/9 = (−7·2)/(9·2) = −14/18.',
        'Hai phân số cùng mẫu dương: −15 < −14 nên −15/18 < −14/18, tức là −5/6 < −7/9.',
        'Số đối của −5/6 là 5/6 = 15/18; số đối của −7/9 là 7/9 = 14/18.',
        'Vì 15/18 > 14/18 nên 5/6 > 7/9: khi hai số âm so sánh theo chiều này thì hai số đối so sánh theo chiều ngược lại.',
      ],
      answer: '−5/6 < −7/9; còn số đối của chúng thì 5/6 > 7/9.',
    },
    checkQuestions: [
      {
        prompt: 'Khẳng định nào sau đây đúng?',
        choices: [
          { id: 'a', label: 'Mọi số nguyên đều là số hữu tỉ' },
          { id: 'b', label: 'Số −0,75 không phải số hữu tỉ vì có dấu phẩy' },
          { id: 'c', label: '3/0 là một số hữu tỉ' },
          { id: 'd', label: 'Mọi số hữu tỉ đều là số nguyên' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Số nguyên n viết được thành n/1 nên là số hữu tỉ, vậy chọn a. Số −0,75 = −3/4 vẫn là số hữu tỉ dù có dấu phẩy. ' +
          'Còn 3/0 không tồn tại vì mẫu số phải khác 0, và 3/4 là số hữu tỉ nhưng không phải số nguyên.',
      },
      {
        prompt:
          'Tìm số đối của số hữu tỉ −15/(−20), viết dưới dạng phân số tối giản có mẫu dương (nhập tử số âm nếu có).',
        answer: { kind: 'fraction', num: -3, den: 4, requireSimplified: true },
        explain:
          'Trước hết −15/(−20) = 15/20 = 3/4 (tử và mẫu cùng âm thì thương dương). Số đối của 3/4 là −3/4. ' +
          'Lỗi hay gặp là quên rút gọn hoặc lấy nghịch đảo 4/3 thay vì số đối.',
      },
      {
        prompt:
          'Điểm M biểu diễn số hữu tỉ −7/4 trên trục số. M nằm giữa hai số nguyên liên tiếp. ' +
          'Số nguyên nhỏ hơn trong hai số đó là bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -2 },
        explain:
          '−7/4 = −1,75 nên nằm giữa −2 và −1; số nguyên nhỏ hơn là −2. Lỗi hay gặp là chọn −1 vì nghĩ "1,75 gần 2 hơn", ' +
          'nhưng ở phía số âm thì −1,75 nằm bên phải −2, tức là lớn hơn −2.',
      },
      {
        prompt:
          'Một nhóm khảo sát ghi độ sâu so với mực nước biển (dấu âm là dưới mặt nước): điểm A ở −3/4 km, điểm B ở −2/3 km, ' +
          'điểm C ở −5/8 km. Điểm nào nằm sâu nhất?',
        choices: [
          { id: 'a', label: 'Điểm A' },
          { id: 'b', label: 'Điểm B' },
          { id: 'c', label: 'Điểm C' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Quy đồng mẫu 24: A = −18/24, B = −16/24, C = −15/24. Số nhỏ nhất là −18/24, tức điểm A, nên A sâu nhất. ' +
          'Lỗi hay gặp là chọn C vì bỏ dấu âm rồi thấy 5/8 "nhỏ nhất"; nhưng ở phía số âm, số càng nhỏ thì càng sâu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Số hữu tỉ là gì? Kí hiệu tập hợp?',
        dap: 'Số viết được dưới dạng a/b với a, b nguyên và b ≠ 0. Kí hiệu là ℚ.',
      },
      {
        hoi: 'Số đối của a/b là gì, và hai số đối nằm thế nào trên trục số?',
        dap: 'Là −a/b; hai số đối nằm hai phía của gốc 0 và cách đều 0, tổng bằng 0.',
      },
      {
        hoi: 'Cách so sánh hai số hữu tỉ khác mẫu?',
        dap: 'Đưa về cùng mẫu dương rồi so tử. Số dương > 0 > số âm; trên trục số, số bên trái nhỏ hơn.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c1-b2',
    grade: '7',
    chapterNumber: 1,
    chapterTitle: 'Số hữu tỉ',
    lessonNumber: 2,
    title: 'Cộng, trừ, nhân, chia số hữu tỉ và quy tắc chuyển vế',
    hook:
      'Bể nước nhà Lan đang có 3/4 bể. Sáng nay cả nhà dùng hết 1/5 bể, chiều bố bơm thêm 2/5 bể. ' +
      'Muốn biết cuối ngày bể còn bao nhiêu, em phải cộng và trừ các phân số khác mẫu, có khi còn cả số âm. ' +
      'Bài này tổng hợp bốn phép tính với số hữu tỉ và dạy một "mẹo" rất mạnh để tìm số chưa biết: quy tắc chuyển vế.',
    theory:
      'CỘNG, TRỪ SỐ HỮU TỈ\n' +
      'Viết hai số dưới dạng phân số cùng mẫu dương m, rồi cộng hoặc trừ các tử: a/m + b/m = (a + b)/m; a/m − b/m = (a − b)/m. ' +
      'Phép trừ chính là cộng với số đối: x − y = x + (−y).\n' +
      'Phép cộng có tính giao hoán, kết hợp, cộng với 0 và cộng với số đối (x + (−x) = 0), giúp em nhóm các số cho dễ tính.\n' +
      'VÌ SAO phải quy đồng? Chỉ cộng được khi các "phần" cùng cỡ, giống như chỉ cộng được 3 phần tư với 1 phần tư.\n\n' +
      'NHÂN, CHIA SỐ HỮU TỈ\n' +
      '— Nhân: (a/b)·(c/d) = (a·c)/(b·d). Tích dương nếu hai thừa số cùng dấu, âm nếu khác dấu.\n' +
      '— Chia: (a/b) : (c/d) = (a/b)·(d/c), với c ≠ 0. Tức là nhân với số nghịch đảo của số chia.\n' +
      'Phép nhân có tính giao hoán, kết hợp, nhân với 1 và tính chất phân phối đối với phép cộng: x·(y + z) = x·y + x·z.\n\n' +
      'QUY TẮC CHUYỂN VẾ\n' +
      'Nếu a = b thì a + c = b + c (cộng cùng một số vào hai vế). Từ đó suy ra: khi chuyển một số hạng từ vế này sang vế kia ' +
      'của một đẳng thức, ta phải ĐỔI DẤU số hạng đó. Ví dụ x + 3/4 = 1/2 ⇒ x = 1/2 − 3/4 = −1/4.\n' +
      'VÌ SAO phải đổi dấu? Chuyển 3/4 sang vế phải nghĩa là trừ cả hai vế cho 3/4, nên vế phải thành 1/2 − 3/4.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cộng tử với tử, mẫu với mẫu: 1/2 + 1/3 = 2/5. Sai, đúng là 3/6 + 2/6 = 5/6.\n' +
      '— Chuyển vế mà quên đổi dấu: từ x + 5/6 = 1/3 viết x = 1/3 + 5/6.\n' +
      '— Khi chia, lấy nghịch đảo nhầm số bị chia thay vì số chia.\n' +
      '— Bỏ dấu ngoặc có dấu "−" đứng trước mà không đổi dấu các số hạng trong ngoặc.',
    workedExample: {
      problem: 'Tìm x biết x + 2/3 = (−5/6)·(3/10).',
      steps: [
        'Tính vế phải: (−5/6)·(3/10) = (−5·3)/(6·10) = −15/60 = −1/4.',
        'Đẳng thức trở thành x + 2/3 = −1/4.',
        'Chuyển vế 2/3 sang vế phải và đổi dấu: x = −1/4 − 2/3.',
        'Quy đồng mẫu 12: −1/4 = −3/12 và 2/3 = 8/12, nên x = −3/12 − 8/12 = −11/12.',
        'Thử lại: −11/12 + 8/12 = −3/12 = −1/4 đúng bằng vế phải.',
      ],
      answer: 'x = −11/12.',
    },
    checkQuestions: [
      {
        prompt: 'Kết quả của phép tính −5/6 + 3/4 là:',
        choices: [
          { id: 'a', label: '−1/12' },
          { id: 'b', label: '−1/5' },
          { id: 'c', label: '1/12' },
          { id: 'd', label: '−19/12' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Quy đồng mẫu 12: −10/12 + 9/12 = −1/12. Đáp án −1/5 (tức −2/10) là lỗi cộng tử với tử, mẫu với mẫu. ' +
          'Đáp án 1/12 là do rơi mất dấu âm: −10/12 có giá trị tuyệt đối lớn hơn 9/12 nên kết quả phải âm.',
      },
      {
        prompt: 'Tính (−3/8) : (9/16), viết dưới dạng phân số tối giản (nhập tử số âm nếu có).',
        answer: { kind: 'fraction', num: -2, den: 3, requireSimplified: true },
        explain:
          'Chia cho 9/16 tức là nhân với 16/9: (−3/8)·(16/9) = −48/72 = −2/3. Nên rút gọn trước khi nhân: 3 với 9 cùng chia 3, ' +
          '8 với 16 cùng chia 8. Lỗi hay gặp là nghịch đảo nhầm số bị chia.',
      },
      {
        prompt: 'Tìm x biết x + 5/6 = 1/3. Nhập x dưới dạng số thập phân (nhập số âm nếu có).',
        answer: { kind: 'numeric', value: -0.5 },
        explain:
          'Chuyển vế 5/6 và đổi dấu: x = 1/3 − 5/6 = 2/6 − 5/6 = −3/6 = −1/2 = −0,5. Nếu quên đổi dấu sẽ được x = 7/6, ' +
          'thử lại 7/6 + 5/6 = 2 ≠ 1/3 nên sai.',
      },
      {
        prompt:
          'Bể nước đang có 3/4 dung tích. Sáng dùng hết 1/5 dung tích, chiều bơm thêm 2/5 dung tích. ' +
          'Cuối ngày bể có bao nhiêu phần dung tích? (viết dưới dạng phân số tối giản)',
        answer: { kind: 'fraction', num: 19, den: 20, requireSimplified: true },
        explain:
          'Dùng nước là trừ, bơm thêm là cộng: 3/4 − 1/5 + 2/5 = 15/20 − 4/20 + 8/20 = 19/20. Lỗi hay gặp là cộng cả lượng đã dùng ' +
          'hoặc quên quy đồng; kết quả 19/20 nhỏ hơn 1 nên bể chưa đầy, hợp lý.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phát biểu quy tắc chuyển vế.',
        dap: 'Chuyển một số hạng từ vế này sang vế kia của đẳng thức thì phải đổi dấu số hạng đó.',
      },
      {
        hoi: 'Cách chia hai số hữu tỉ (a/b) : (c/d)?',
        dap: 'Nhân số bị chia với nghịch đảo của số chia: (a/b)·(d/c), với c ≠ 0.',
      },
      {
        hoi: 'Vì sao 1/2 + 1/3 không bằng 2/5?',
        dap: 'Muốn cộng phải quy đồng: 3/6 + 2/6 = 5/6. Không được cộng tử với tử và mẫu với mẫu.',
      },
      {
        hoi: 'Phép trừ x − y viết thành phép cộng thế nào?',
        dap: 'x − y = x + (−y): trừ một số là cộng với số đối của nó.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c1-b3',
    grade: '7',
    chapterNumber: 1,
    chapterTitle: 'Số hữu tỉ',
    lessonNumber: 3,
    title: 'Luỹ thừa với số mũ tự nhiên của một số hữu tỉ',
    hook:
      'Một con vi khuẩn cứ 30 phút lại tách đôi. Bắt đầu chỉ có 1 con, em đoán sau 4 giờ sẽ có bao nhiêu con? ' +
      'Nhiều bạn đoán vài chục, nhưng thật ra là hàng trăm. Viết 2·2·2·2·2·2·2·2 mãi rất dài, nên người ta dùng luỹ thừa để ' +
      'viết gọn: 2⁸. Bài này dạy cách tính và rút gọn luỹ thừa của số hữu tỉ, kể cả số âm và phân số.',
    theory:
      'LUỸ THỪA VỚI SỐ MŨ TỰ NHIÊN\n' +
      'Với x là số hữu tỉ và n là số tự nhiên lớn hơn 1: xⁿ = x·x·…·x (n thừa số x). Quy ước x¹ = x và x⁰ = 1 (x ≠ 0). ' +
      'Số x gọi là cơ số, n gọi là số mũ. Với phân số: (a/b)ⁿ = aⁿ/bⁿ.\n' +
      'Dấu của luỹ thừa: cơ số âm với số mũ chẵn cho kết quả dương, số mũ lẻ cho kết quả âm. ' +
      'Ví dụ (−2)⁴ = 16, (−2)³ = −8. Chú ý (−2)⁴ ≠ −2⁴: cái đầu có ngoặc, cơ số là −2; cái sau cơ số là 2 và dấu trừ đứng ngoài, nên −2⁴ = −16.\n\n' +
      'QUY TẮC CÙNG CƠ SỐ\n' +
      '— Tích: xᵐ·xⁿ = xᵐ⁺ⁿ (giữ cơ số, cộng số mũ).\n' +
      '— Thương: xᵐ : xⁿ = xᵐ⁻ⁿ (x ≠ 0, m ≥ n; giữ cơ số, trừ số mũ).\n' +
      '— Luỹ thừa của luỹ thừa: (xᵐ)ⁿ = xᵐ·ⁿ (giữ cơ số, nhân số mũ).\n' +
      'VÌ SAO? Chỉ cần đếm số thừa số: 2³·2⁴ gồm 3 + 4 = 7 thừa số 2; (2³)⁴ là 4 nhóm, mỗi nhóm 3 thừa số 2, tất cả 3·4 = 12 thừa số.\n\n' +
      'THỨ TỰ THỰC HIỆN PHÉP TÍNH VÀ QUY TẮC DẤU NGOẶC\n' +
      'Thứ tự: trong ngoặc trước; rồi luỹ thừa; rồi nhân, chia; cuối cùng cộng, trừ. Khi bỏ dấu ngoặc: trước ngoặc là dấu "+" thì giữ nguyên ' +
      'dấu các số hạng trong ngoặc; trước ngoặc là dấu "−" thì phải đổi dấu tất cả các số hạng trong ngoặc.\n' +
      'Ví dụ: 1/2 − (1/3 − 1/4) = 1/2 − 1/3 + 1/4.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm (xᵐ)ⁿ thành xᵐ⁺ⁿ: (3²)⁴ = 3⁸ chứ không phải 3⁶.\n' +
      '— Áp quy tắc cộng mũ khi cơ số khác nhau: 2³·3² không bằng 6⁵.\n' +
      '— Nhân cơ số với số mũ: 3⁴ = 12. Sai, 3⁴ = 3·3·3·3 = 81.\n' +
      '— Coi 3·(1/3)² = (3·1/3)²: luỹ thừa phải tính trước phép nhân.',
    workedExample: {
      problem: 'Tính A = (−2/3)³ · (−2/3)² : (−2/3)⁴ và B = 5/4 − 3·(1/2)².',
      steps: [
        'Với A, cả ba luỹ thừa cùng cơ số −2/3. Nhân trước: (−2/3)³·(−2/3)² = (−2/3)³⁺² = (−2/3)⁵.',
        'Chia: (−2/3)⁵ : (−2/3)⁴ = (−2/3)⁵⁻⁴ = (−2/3)¹ = −2/3. Vậy A = −2/3.',
        'Với B, tính luỹ thừa trước: (1/2)² = 1/4.',
        'Rồi đến phép nhân: 3·(1/4) = 3/4.',
        'Cuối cùng phép trừ: B = 5/4 − 3/4 = 2/4 = 1/2.',
      ],
      answer: 'A = −2/3 và B = 1/2.',
    },
    checkQuestions: [
      {
        prompt: 'Giá trị của (−3)⁴ là:',
        choices: [
          { id: 'a', label: '81' },
          { id: 'b', label: '−81' },
          { id: 'c', label: '12' },
          { id: 'd', label: '−12' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          '(−3)⁴ = (−3)·(−3)·(−3)·(−3) = 81, vì số mũ chẵn nên kết quả dương. Đáp án −81 là kết quả của −3⁴ (không có ngoặc), ' +
          'còn 12 là lỗi nhân cơ số với số mũ.',
      },
      {
        prompt: 'Tính 1/2 + 3·(−1/3)², viết kết quả dưới dạng phân số tối giản.',
        answer: { kind: 'fraction', num: 5, den: 6, requireSimplified: true },
        explain:
          'Luỹ thừa trước: (−1/3)² = 1/9. Nhân: 3·(1/9) = 1/3. Cộng: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. ' +
          'Lỗi hay gặp là gộp 3·(−1/3) = −1 rồi bình phương, ra 1, làm sai thứ tự phép tính.',
      },
      {
        prompt: 'Tìm số tự nhiên n biết (3²)ⁿ = 3¹².',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Luỹ thừa của luỹ thừa thì nhân số mũ: (3²)ⁿ = 3²ⁿ, nên 2n = 12 và n = 6. Lỗi hay gặp là cộng số mũ (2 + n = 12) ' +
          'ra n = 10; thử 10 thì (3²)¹⁰ = 3²⁰, không bằng 3¹² nên sai.',
      },
      {
        prompt:
          'Một con vi khuẩn cứ 30 phút lại tách thành 2 con. Bắt đầu có 1 con, hỏi sau 4 giờ có bao nhiêu con vi khuẩn?',
        answer: { kind: 'numeric', value: 256 },
        explain:
          '4 giờ gồm 8 lần 30 phút, mỗi lần số con nhân đôi nên có 2⁸ = 256 con. Lỗi hay gặp là tính 2·8 = 16: ' +
          'đó là phép nhân chứ không phải luỹ thừa, vì mỗi lần nhân đôi chứ không phải cộng thêm 2 con.',
      },
    ],
    srsCards: [
      {
        hoi: 'xᵐ·xⁿ và xᵐ : xⁿ bằng gì?',
        dap: 'xᵐ·xⁿ = xᵐ⁺ⁿ (cộng mũ); xᵐ : xⁿ = xᵐ⁻ⁿ (trừ mũ), với x ≠ 0 và m ≥ n.',
      },
      {
        hoi: '(xᵐ)ⁿ bằng gì?',
        dap: 'xᵐ·ⁿ: giữ cơ số, nhân hai số mũ.',
      },
      {
        hoi: 'Khi nào luỹ thừa của số âm là số âm?',
        dap: 'Khi số mũ lẻ. Số mũ chẵn cho kết quả dương. Chú ý (−2)⁴ = 16 nhưng −2⁴ = −16.',
      },
      {
        hoi: 'Thứ tự thực hiện phép tính trong một biểu thức?',
        dap: 'Ngoặc, rồi luỹ thừa, rồi nhân và chia, cuối cùng cộng và trừ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
