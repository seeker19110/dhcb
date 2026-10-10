// lessons/toan9c2.ts — Toán 9, Chương 2: Phương trình và bất phương trình bậc nhất một ẩn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C2_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c2-b1',
    grade: '9',
    chapterNumber: 2,
    chapterTitle: 'Phương trình và bất phương trình bậc nhất một ẩn',
    lessonNumber: 1,
    title: 'Phương trình quy về phương trình bậc nhất một ẩn',
    hook:
      'Nam đi xe đạp đến trường, quãng đường 6 km với vận tốc x km/h thì mất 6/x giờ: ẩn x nằm ở mẫu số, và nếu cho x = 0 thì phép tính vô nghĩa. ' +
      'Có những phương trình trông phức tạp (một tích bằng 0, hoặc có ẩn ở mẫu) nhưng chỉ cần một vài bước biến đổi là quy về phương trình bậc nhất mà em đã biết giải. ' +
      'Bài này dạy hai kiểu đó và một thói quen quan trọng: luôn kiểm tra điều kiện trước khi kết luận nghiệm.',
    theory:
      'PHƯƠNG TRÌNH TÍCH\n' +
      'Phương trình có dạng A(x) · B(x) = 0, chẳng hạn (ax + b)(cx + d) = 0, được giải dựa vào tính chất: một tích bằng 0 khi và chỉ khi có ít nhất một thừa số bằng 0. ' +
      'Vậy A(x) · B(x) = 0 khi A(x) = 0 hoặc B(x) = 0.\n' +
      'Ví dụ (2x − 3)(x + 4) = 0 thì 2x − 3 = 0 hoặc x + 4 = 0, được x = 3/2 hoặc x = −4.\n' +
      'Phương trình chưa có dạng tích thì chuyển hết về một vế (vế kia bằng 0), rồi phân tích vế trái thành nhân tử bằng cách đặt nhân tử chung hoặc dùng hằng đẳng thức, như đã học ở lớp 8.\n' +
      'VÌ SAO không giải (x − 2)(x + 3) = 5 theo cách trên? Tích bằng 0 mới cho ta kết luận về từng thừa số; tích bằng 5 thì hai thừa số có thể lấy vô số cặp giá trị khác nhau.\n\n' +
      'PHƯƠNG TRÌNH CHỨA ẨN Ở MẪU\n' +
      'Bước 1. Tìm điều kiện xác định (ĐKXĐ): mọi mẫu số phải khác 0.\n' +
      'Bước 2. Quy đồng mẫu hai vế rồi khử mẫu (nhân hai vế với mẫu chung, nhớ nhân cả các hạng tử không có mẫu).\n' +
      'Bước 3. Giải phương trình nhận được.\n' +
      'Bước 4. Đối chiếu từng nghiệm với ĐKXĐ: nghiệm nào làm một mẫu bằng 0 thì LOẠI. Các giá trị còn lại là nghiệm của phương trình ban đầu.\n' +
      'VÌ SAO có thể phải loại nghiệm? Khi nhân hai vế với một biểu thức có chứa x, ta có thể làm xuất hiện nghiệm mà phương trình ban đầu không có nghĩa tại đó. Bước đối chiếu ĐKXĐ chính là để bắt lỗi này.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Giải (x − 2)(x + 3) = 0 mà chỉ lấy một nghiệm, hoặc giải ra x − 2 = 0 và x + 3 = 0 nhưng viết nghiệm sai dấu (x = −2 hoặc x = 3).\n' +
      '— Bỏ qua bước tìm ĐKXĐ nên không loại nghiệm làm mẫu bằng 0.\n' +
      '— Khử mẫu mà chỉ nhân các hạng tử có mẫu, quên nhân hạng tử còn lại.\n' +
      '— Chia hai vế cho một biểu thức chứa x (như x − 2) để "rút gọn": làm mất nghiệm x = 2. Đúng hơn là chuyển về vế trái và phân tích thành nhân tử.',
    workedExample: {
      problem:
        'Giải các phương trình: a) (2x − 3)(x + 4) = 0. b) x² − 4 = 3(x − 2). c) 1/(x − 2) + 3 = (x − 1)/(x − 2).',
      steps: [
        'a) Tích bằng 0 nên 2x − 3 = 0 hoặc x + 4 = 0, suy ra x = 3/2 hoặc x = −4.',
        'b) Chuyển về vế trái và phân tích: (x − 2)(x + 2) − 3(x − 2) = 0, đặt nhân tử chung x − 2 được (x − 2)(x + 2 − 3) = 0, tức (x − 2)(x − 1) = 0.',
        'b) Suy ra x − 2 = 0 hoặc x − 1 = 0, tức x = 2 hoặc x = 1.',
        'c) ĐKXĐ: x − 2 ≠ 0, tức x ≠ 2.',
        'c) Nhân hai vế với x − 2 (nhớ nhân cả số 3): 1 + 3(x − 2) = x − 1, thu gọn 3x − 5 = x − 1.',
        'c) Giải ra 2x = 4 và x = 2. Nhưng x = 2 không thỏa ĐKXĐ nên bị loại, phương trình vô nghiệm.',
      ],
      answer: 'a) x = 3/2 hoặc x = −4. b) x = 2 hoặc x = 1. c) Vô nghiệm.',
    },
    checkQuestions: [
      {
        prompt:
          'Giải phương trình (2x − 5)(3x + 9) = 0. Nghiệm lớn hơn của phương trình bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 2.5 },
        explain:
          'Tích bằng 0 nên 2x − 5 = 0 hoặc 3x + 9 = 0, suy ra x = 2,5 hoặc x = −3. Nghiệm lớn hơn là 2,5. ' +
          'Lỗi hay gặp là giải 3x + 9 = 0 thành x = 3 (sai dấu) hoặc quên rằng phương trình có hai nghiệm.',
      },
      {
        prompt:
          'Giải phương trình x² − 9 = 2(x + 3). Tổng hai nghiệm của phương trình bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Viết x² − 9 = (x − 3)(x + 3), chuyển vế: (x + 3)(x − 3) − 2(x + 3) = 0 nên (x + 3)(x − 5) = 0, được x = −3 hoặc x = 5. Tổng hai nghiệm là −3 + 5 = 2. ' +
          'Lỗi hay gặp là chia hai vế cho x + 3 và chỉ còn nghiệm x = 5, làm mất nghiệm x = −3.',
      },
      {
        prompt: 'Phương trình (x² − 4)/(x − 2) = 0 có kết luận nào sau đây là đúng?',
        choices: [
          { id: 'a', label: 'Có đúng một nghiệm x = −2' },
          { id: 'b', label: 'Có hai nghiệm x = 2 và x = −2' },
          { id: 'c', label: 'Có đúng một nghiệm x = 2' },
          { id: 'd', label: 'Vô nghiệm' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'ĐKXĐ là x ≠ 2. Với x ≠ 2, tử x² − 4 = (x − 2)(x + 2) bằng 0 khi x = 2 hoặc x = −2; loại x = 2 vì không thỏa ĐKXĐ, còn x = −2 thỏa. ' +
          'Lỗi hay gặp là quên kiểm ĐKXĐ nên giữ cả hai nghiệm (đáp án b).',
      },
      {
        prompt: 'Giải phương trình 2/(x − 1) = 3/(x + 2). Nghiệm x bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 7 },
        explain:
          'ĐKXĐ: x ≠ 1 và x ≠ −2. Nhân chéo: 2(x + 2) = 3(x − 1), tức 2x + 4 = 3x − 3, suy ra x = 7, thỏa ĐKXĐ. Thử lại: 2/6 = 1/3 và 3/9 = 1/3. ' +
          'Lỗi hay gặp là sai dấu khi mở ngoặc −3 (viết 3x + 3 thay vì 3x − 3).',
      },
    ],
    srsCards: [
      {
        hoi: 'Cách giải phương trình tích A(x) · B(x) = 0?',
        dap: 'Một tích bằng 0 khi có ít nhất một thừa số bằng 0: giải A(x) = 0 hoặc B(x) = 0 rồi gộp nghiệm.',
      },
      {
        hoi: 'Phương trình chưa là tích thì giải thế nào?',
        dap: 'Chuyển hết về một vế (vế kia bằng 0), phân tích vế trái thành nhân tử rồi giải như phương trình tích.',
      },
      {
        hoi: 'Các bước giải phương trình chứa ẩn ở mẫu?',
        dap: 'Tìm ĐKXĐ (mẫu khác 0); quy đồng, khử mẫu; giải; đối chiếu ĐKXĐ và loại nghiệm không thỏa.',
      },
      {
        hoi: 'Vì sao phải đối chiếu ĐKXĐ ở cuối?',
        dap: 'Vì khử mẫu có thể sinh nghiệm làm mẫu bằng 0; nghiệm đó không thuộc phương trình ban đầu nên phải loại.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c2-b2',
    grade: '9',
    chapterNumber: 2,
    chapterTitle: 'Phương trình và bất phương trình bậc nhất một ẩn',
    lessonNumber: 2,
    title: 'Bất đẳng thức và tính chất',
    hook:
      'Buổi sáng ở Sa Pa là −2 °C còn ở Hà Nội là 15 °C, nên −2 < 15. Hôm sau cả hai nơi cùng ấm lên 5 °C: 3 °C và 20 °C, thứ tự vẫn giữ nguyên. ' +
      'Nhưng nếu đổi dấu cả hai nhiệt độ thì 2 > −15, thứ tự bị đảo ngược. Bài này dạy em các tính chất giúp em biết khi nào thứ tự giữ nguyên, ' +
      'khi nào bị đảo, đây là nền tảng để giải bất phương trình ở bài sau.',
    theory:
      'BẤT ĐẲNG THỨC\n' +
      'Hệ thức dạng a < b, a > b, a ≤ b hoặc a ≥ b gọi là bất đẳng thức; a gọi là vế trái, b gọi là vế phải. ' +
      'a ≤ b có nghĩa là a < b hoặc a = b. Trên trục số, số nhỏ hơn nằm bên trái số lớn hơn.\n\n' +
      'BA TÍNH CHẤT CƠ BẢN\n' +
      '1) Liên hệ thứ tự và phép cộng: nếu a < b thì a + c < b + c (cộng cùng một số vào hai vế thì giữ nguyên chiều). Cũng đúng khi trừ cùng một số.\n' +
      '2) Liên hệ thứ tự và phép nhân:\n' +
      '— Nếu a < b và c > 0 thì ac < bc (nhân với số DƯƠNG: giữ nguyên chiều).\n' +
      '— Nếu a < b và c < 0 thì ac > bc (nhân với số ÂM: ĐỔI chiều).\n' +
      'Chia cho một số khác 0 cũng như nhân với số nghịch đảo của nó, nên chia cho số dương giữ chiều, chia cho số âm đổi chiều.\n' +
      '3) Tính chất bắc cầu: nếu a < b và b < c thì a < c.\n' +
      'Các tính chất trên cũng đúng với các dấu >, ≤, ≥ (với ≤ và ≥ vẫn đổi chiều khi nhân số âm).\n\n' +
      'VÌ SAO nhân số âm thì đổi chiều? Ví dụ 2 < 3. Nhân hai vế với −1: phép nhân với −1 lật trục số qua điểm 0, số 2 ở bên trái số 3 sẽ thành −2 nằm ở bên phải −3. Vậy −2 > −3.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhân (hoặc chia) hai vế với số âm mà quên đổi chiều bất đẳng thức.\n' +
      '— Đổi chiều khi cộng, trừ hoặc khi nhân số dương (chỉ nhân, chia SỐ ÂM mới đổi).\n' +
      '— Nhầm khi so sánh số âm: −5 < −2 (số đối của số lớn hơn thì nhỏ hơn), không phải −5 > −2.\n' +
      '— Dùng bắc cầu với hai bất đẳng thức ngược chiều, như a < b và c < b thì chưa kết luận được a, c nhỏ hay lớn hơn nhau.',
    workedExample: {
      problem:
        'Cho a < b. a) So sánh 3a + 5 và 3b + 5. b) So sánh −2a + 1 và −2b + 1. c) Biết thêm b < 2, chứng minh 3a − 1 < 5.',
      steps: [
        'a) Nhân hai vế a < b với 3 (số dương) giữ chiều: 3a < 3b. Cộng 5 vào hai vế: 3a + 5 < 3b + 5.',
        'b) Nhân hai vế a < b với −2 (số âm) thì đổi chiều: −2a > −2b.',
        'b) Cộng 1 vào hai vế: −2a + 1 > −2b + 1.',
        'c) Từ a < b và b < 2, theo tính chất bắc cầu ta có a < 2.',
        'c) Nhân hai vế với 3 (số dương): 3a < 6. Trừ 1 vào hai vế: 3a − 1 < 5. Điều phải chứng minh.',
      ],
      answer: 'a) 3a + 5 < 3b + 5. b) −2a + 1 > −2b + 1. c) 3a − 1 < 5.',
    },
    checkQuestions: [
      {
        prompt: 'Biết a < b. Khẳng định nào dưới đây luôn đúng?',
        choices: [
          { id: 'a', label: '5a > 5b' },
          { id: 'b', label: '−3a < −3b' },
          { id: 'c', label: 'a − 7 < b − 7' },
          { id: 'd', label: '−a < −b' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Trừ cùng một số vào hai vế thì giữ chiều: a − 7 < b − 7 (đáp án c). Đáp án a sai vì nhân với 5 > 0 giữ chiều (5a < 5b); ' +
          'đáp án b và d sai vì nhân với số âm phải đổi chiều (−3a > −3b và −a > −b). Lỗi hay gặp là quên đổi chiều khi nhân số âm.',
      },
      {
        prompt: 'Biết 3a − 4 ≤ 11. Khi đó a ≤ k. Giá trị của k bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Cộng 4 vào hai vế: 3a ≤ 15. Chia hai vế cho 3 (số dương, giữ chiều): a ≤ 5. Vậy k = 5. ' +
          'Lỗi hay gặp là trừ 4 thay vì cộng 4 khi chuyển (ra 3a ≤ 7).',
      },
      {
        prompt: 'Biết −2a + 3 > 9. Khi đó a < k. Giá trị của k bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -3 },
        explain:
          'Trừ 3 vào hai vế: −2a > 6. Chia hai vế cho −2 (số âm) thì đổi chiều: a < −3. Vậy k = −3. ' +
          'Lỗi hay gặp là chia cho −2 mà giữ nguyên chiều, ra a > −3.',
      },
      {
        prompt: 'Biết −3n > −20 với n là số nguyên. Số nguyên n lớn nhất thỏa mãn là bao nhiêu?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Chia hai vế cho −3 (số âm) thì đổi chiều: n < 20/3 ≈ 6,67. Số nguyên lớn nhất nhỏ hơn 20/3 là 6. Thử lại: −3 · 6 = −18 > −20, còn −3 · 7 = −21 không lớn hơn −20. ' +
          'Lỗi hay gặp là không đổi chiều, ra n > 6,67 và kết luận n = 7.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nếu a < b thì a + c và b + c so sánh thế nào?',
        dap: 'a + c < b + c: cộng (trừ) cùng một số vào hai vế thì giữ nguyên chiều bất đẳng thức.',
      },
      {
        hoi: 'Nhân hai vế của bất đẳng thức với số dương và số âm khác nhau thế nào?',
        dap: 'Với c > 0: giữ chiều (a < b thì ac < bc). Với c < 0: đổi chiều (a < b thì ac > bc).',
      },
      {
        hoi: 'Tính chất bắc cầu của bất đẳng thức?',
        dap: 'Nếu a < b và b < c thì a < c.',
      },
      {
        hoi: 'Vì sao nhân với số âm thì đổi chiều?',
        dap: 'Nhân với số âm lật trục số qua điểm 0, nên số nằm bên trái sẽ chuyển sang bên phải, ví dụ 2 < 3 nhưng −2 > −3.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c2-b3',
    grade: '9',
    chapterNumber: 2,
    chapterTitle: 'Phương trình và bất phương trình bậc nhất một ẩn',
    lessonNumber: 3,
    title: 'Bất phương trình bậc nhất một ẩn',
    hook:
      'Thang máy của chung cư có tải trọng tối đa 450 kg. An nặng 45 kg và muốn chở lên các thùng nước, mỗi thùng nặng 20 kg. ' +
      'Gọi x là số thùng nước, tổng khối lượng 45 + 20x phải không vượt quá 450. Câu hỏi "nhiều nhất bao nhiêu thùng" không còn là phương trình mà là một bất phương trình. ' +
      'Bài này dạy em giải bất phương trình bậc nhất và dùng nó để giải các bài toán "ít nhất, nhiều nhất".',
    theory:
      'BẤT PHƯƠNG TRÌNH BẬC NHẤT MỘT ẨN\n' +
      'Là bất phương trình có dạng ax + b > 0 (hoặc ax + b < 0, ax + b ≥ 0, ax + b ≤ 0), trong đó a, b là các số cho trước và a ≠ 0. Ví dụ 3x − 6 > 0; 5 − 2x ≤ 0.\n' +
      'Số x₀ làm cho bất phương trình đúng khi thay x = x₀ gọi là một nghiệm. Tập hợp mọi nghiệm là tập nghiệm; giải bất phương trình là tìm tập nghiệm đó. ' +
      'Khác với phương trình bậc nhất, bất phương trình thường có VÔ SỐ nghiệm (một khoảng trên trục số).\n\n' +
      'HAI QUY TẮC BIẾN ĐỔI (dựa vào tính chất ở bài trước)\n' +
      '— Quy tắc chuyển vế: chuyển một hạng tử từ vế này sang vế kia thì đổi dấu hạng tử đó.\n' +
      '— Quy tắc nhân (chia) với một số khác 0: số DƯƠNG thì giữ nguyên chiều; số ÂM thì ĐỔI chiều bất đẳng thức.\n\n' +
      'CÁC BƯỚC GIẢI\n' +
      '1) Bỏ ngoặc, khử mẫu (nếu có).\n' +
      '2) Chuyển các hạng tử chứa ẩn sang một vế, hằng số sang vế kia.\n' +
      '3) Thu gọn rồi chia hai vế cho hệ số của ẩn, nhớ đổi chiều nếu hệ số âm.\n' +
      'Ví dụ 3x − 6 > 0 ⇔ 3x > 6 ⇔ x > 2. Còn −2x + 8 ≥ 0 ⇔ −2x ≥ −8 ⇔ x ≤ 4 (chia cho −2 nên đổi chiều).\n' +
      'VÌ SAO phải kiểm tra bằng cách thử? Chọn một số bất kì thuộc tập nghiệm, thay vào bất phương trình ban đầu thấy đúng, rồi thử một số ngoài tập nghiệm thấy sai, là cách nhanh để bắt lỗi quên đổi chiều.\n\n' +
      'BÀI TOÁN "ÍT NHẤT", "NHIỀU NHẤT"\n' +
      '— "Không vượt quá", "tối đa", "nhiều nhất": dùng dấu ≤.\n' +
      '— "Ít nhất", "tối thiểu", "không thấp hơn": dùng dấu ≥.\n' +
      'Giải xong phải chọn đáp số phù hợp với bài (số người, số cái là số nguyên) rồi kiểm lại.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Chia cho số âm mà không đổi chiều.\n' +
      '— Đổi chiều khi chuyển vế (chuyển vế chỉ đổi dấu hạng tử, KHÔNG đổi chiều).\n' +
      '— Nhầm dấu < với ≤: nghiệm nguyên lớn nhất của x < 5 là 4, còn của x ≤ 5 là 5.\n' +
      '— Trả lời số thập phân cho đại lượng chỉ nhận số nguyên (chia ra 9,58 quyển thì chỉ mua được 9 quyển).',
    workedExample: {
      problem:
        'a) Giải bất phương trình 5 − 3x ≥ 2x − 10. b) Lan có 200 nghìn đồng, mua một chiếc ba lô giá 85 nghìn đồng, số tiền còn lại dùng mua vở giá 12 nghìn đồng một quyển. Lan mua được nhiều nhất bao nhiêu quyển vở?',
      steps: [
        'a) Chuyển vế, đổi dấu: −3x − 2x ≥ −10 − 5, tức −5x ≥ −15.',
        'a) Chia hai vế cho −5 (số âm) nên đổi chiều: x ≤ 3. Thử: x = 3 thì −4 ≥ −4 đúng; x = 4 thì −7 ≥ −2 sai.',
        'b) Gọi x là số quyển vở Lan mua, x là số nguyên không âm.',
        'b) Tổng tiền không vượt quá 200 nghìn đồng: 85 + 12x ≤ 200, suy ra 12x ≤ 115 và x ≤ 115/12 ≈ 9,58.',
        'b) x là số nguyên nên x nhiều nhất là 9. Kiểm tra: 85 + 12 · 9 = 193 ≤ 200, còn 85 + 12 · 10 = 205 > 200.',
      ],
      answer: 'a) x ≤ 3. b) Lan mua được nhiều nhất 9 quyển vở.',
    },
    checkQuestions: [
      {
        prompt: 'Số nguyên lớn nhất thỏa mãn bất phương trình 3x − 7 < 8 là bao nhiêu?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Chuyển vế: 3x < 15, chia hai vế cho 3 (số dương) được x < 5. Vì dấu là < (không có dấu bằng) nên x = 5 không thỏa, số nguyên lớn nhất là 4. ' +
          'Lỗi hay gặp là đáp 5, quên rằng 3 · 5 − 7 = 8 không nhỏ hơn 8.',
      },
      {
        prompt:
          'Giải bất phương trình 4 − 2x > 10. Tập nghiệm có dạng x < k. Giá trị của k bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -3 },
        explain:
          'Chuyển vế: −2x > 6. Chia hai vế cho −2 (số âm) thì đổi chiều: x < −3. Vậy k = −3. Thử: x = −4 thì 4 + 8 = 12 > 10 đúng. ' +
          'Lỗi hay gặp là chia cho −2 mà không đổi chiều, ra x > −3.',
      },
      {
        prompt: 'Nghiệm của bất phương trình 2(x − 1) ≥ 5x + 4 là',
        choices: [
          { id: 'a', label: 'x ≥ −2' },
          { id: 'b', label: 'x ≤ 2' },
          { id: 'c', label: 'x ≥ 2' },
          { id: 'd', label: 'x ≤ −2' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'Bỏ ngoặc: 2x − 2 ≥ 5x + 4, chuyển vế: −3x ≥ 6. Chia hai vế cho −3 (số âm) nên đổi chiều: x ≤ −2. Thử x = −3: 2 · (−4) = −8 ≥ −11 đúng. ' +
          'Phương án a là kết quả khi quên đổi chiều; phương án b và c sai dấu của −2.',
      },
      {
        prompt:
          'Mai đã có hai bài kiểm tra được 7 điểm và 8,5 điểm. Để điểm trung bình ba bài kiểm tra không thấp hơn 8 thì bài thứ ba Mai phải đạt ít nhất bao nhiêu điểm?',
        answer: { kind: 'numeric', value: 8.5 },
        explain:
          'Gọi x là điểm bài thứ ba: (7 + 8,5 + x)/3 ≥ 8. Nhân hai vế với 3 (số dương): 15,5 + x ≥ 24, suy ra x ≥ 8,5. Thử: (7 + 8,5 + 8,5)/3 = 8. ' +
          'Lỗi hay gặp là quên nhân 3 cho vế phải rồi ra 15,5 + x ≥ 8.',
      },
    ],
    srsCards: [
      {
        hoi: 'Bất phương trình bậc nhất một ẩn có dạng nào?',
        dap: 'ax + b > 0 (hoặc < 0, ≥ 0, ≤ 0) với a ≠ 0; thường có vô số nghiệm.',
      },
      {
        hoi: 'Hai quy tắc biến đổi bất phương trình?',
        dap: 'Chuyển vế thì đổi dấu hạng tử; nhân (chia) hai vế với số dương thì giữ chiều, với số âm thì đổi chiều.',
      },
      {
        hoi: 'Ví dụ giải bất phương trình có hệ số âm?',
        dap: '−2x + 8 ≥ 0 ⇔ −2x ≥ −8 ⇔ x ≤ 4 (chia cho −2 nên đổi chiều).',
      },
      {
        hoi: 'Từ khoá "ít nhất", "nhiều nhất" ứng với dấu nào?',
        dap: '"Ít nhất", "không thấp hơn": dùng ≥. "Nhiều nhất", "không vượt quá": dùng ≤. Nhớ chọn đáp số phù hợp (nguyên nếu đếm).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
