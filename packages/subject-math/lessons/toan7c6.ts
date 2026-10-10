// lessons/toan7c6.ts — Toán 7, Chương 6: Tỉ lệ thức và đại lượng tỉ lệ.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C6_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c6-b1',
    grade: '7',
    chapterNumber: 6,
    chapterTitle: 'Tỉ lệ thức và đại lượng tỉ lệ',
    lessonNumber: 1,
    title: 'Tỉ lệ thức và tính chất của dãy tỉ số bằng nhau',
    hook:
      'Ba bạn Mai, Nam, Hà góp tiền mua quà sinh nhật cho cô giáo theo tỉ lệ 2 : 3 : 5, tổng cộng được 300 000 đồng. ' +
      'Mỗi bạn góp bao nhiêu? Nếu chỉ biết tỉ số mà không biết một số tiền cụ thể nào, em vẫn tìm được đáp án, ' +
      'nhờ một công cụ rất gọn: tính chất của dãy tỉ số bằng nhau. Bài này bắt đầu từ tỉ lệ thức rồi đi tới công cụ đó.',
    theory:
      'TỈ LỆ THỨC\n' +
      'Tỉ lệ thức là đẳng thức của hai tỉ số: a/b = c/d (hay a : b = c : d), với b, d ≠ 0. ' +
      'Các số a, d gọi là ngoại tỉ (số ngoài); b, c gọi là trung tỉ (số trong). Ví dụ 3/4 = 6/8 là một tỉ lệ thức.\n' +
      'Tính chất 1: nếu a/b = c/d thì a·d = b·c (tích ngoại tỉ bằng tích trung tỉ). VÌ SAO? Nhân hai vế của a/b = c/d với b·d ' +
      'thì được a·d = c·b.\n' +
      'Ngược lại, nếu a·d = b·c (các số khác 0) thì ta lập được các tỉ lệ thức: a/b = c/d; a/c = b/d; d/b = c/a; d/c = b/a. ' +
      'Ví dụ từ 3·8 = 4·6 có 3/4 = 6/8 và 3/6 = 4/8.\n' +
      'Dùng để tìm số chưa biết: từ 3/x = 12/20 suy ra 12·x = 3·20, nên x = 5.\n\n' +
      'DÃY TỈ SỐ BẰNG NHAU\n' +
      'Nếu a/b = c/d thì a/b = c/d = (a + c)/(b + d) = (a − c)/(b − d) (với các mẫu khác 0). ' +
      'Mở rộng cho nhiều tỉ số: a/b = c/d = e/f = (a + c + e)/(b + d + f).\n' +
      'VÌ SAO? Đặt chung giá trị a/b = c/d = k. Khi đó a = b·k và c = d·k, nên a + c = k·(b + d), suy ra (a + c)/(b + d) = k. Làm tương tự với hiệu.\n' +
      'Cách viết x : y : z = 2 : 3 : 5 có nghĩa là x/2 = y/3 = z/5.\n' +
      'Ví dụ: x/3 = y/5 và x + y = 40. Ta có x/3 = y/5 = (x + y)/(3 + 5) = 40/8 = 5, suy ra x = 15, y = 25.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết nhầm tích: từ a/b = c/d lại viết a·b = c·d (phải là a·d = b·c).\n' +
      '— Lấy tổng ở tử nhưng hiệu ở mẫu: với x/3 = y/5 và x + y = 40 thì phải chia cho 3 + 5, không phải 5 − 3.\n' +
      '— Khi cho hiệu thì chia cho hiệu hai số ở mẫu theo ĐÚNG thứ tự: nếu y − x thì mẫu là 7 − 4 (y đi với 7, x đi với 4).\n' +
      '— Quên bước cuối: tìm k rồi mà chưa nhân lại để tìm từng số.\n' +
      '— Không thử lại. Luôn kiểm tra giá trị tìm được thoả cả tỉ lệ và điều kiện tổng/hiệu.',
    workedExample: {
      problem: 'Tìm hai số x và y biết x/4 = y/7 và y − x = 15.',
      steps: [
        'Theo tính chất dãy tỉ số bằng nhau, x/4 = y/7 = (y − x)/(7 − 4). Chú ý y đi với 7 và x đi với 4 nên hiệu phải là y − x và 7 − 4.',
        'Thay số: (y − x)/(7 − 4) = 15/3 = 5.',
        'Vậy x/4 = 5 nên x = 4·5 = 20; và y/7 = 5 nên y = 7·5 = 35.',
        'Thử lại: 20/4 = 5 và 35/7 = 5 nên tỉ lệ thức đúng; y − x = 35 − 20 = 15 đúng điều kiện.',
      ],
      answer: 'x = 20 và y = 35.',
    },
    checkQuestions: [
      {
        prompt: 'Từ đẳng thức 3·8 = 4·6, ta lập được tỉ lệ thức nào sau đây?',
        choices: [
          { id: 'a', label: '3/4 = 6/8' },
          { id: 'b', label: '3/4 = 8/6' },
          { id: 'c', label: '3/6 = 8/4' },
          { id: 'd', label: '3/8 = 4/6' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Tích ngoại tỉ bằng tích trung tỉ: ngoại tỉ 3 và 8, trung tỉ 4 và 6 cho 3/4 = 6/8; kiểm tra 3·8 = 24 = 4·6. ' +
          'Các đáp án khác đặt sai chỗ: ví dụ 3/4 = 8/6 có tích chéo 3·6 = 18 ≠ 4·8 = 32.',
      },
      {
        prompt: 'Tìm x trong tỉ lệ thức 3/x = 12/20.',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Tích chéo: 12·x = 3·20 = 60, nên x = 60 : 12 = 5. Lỗi hay gặp là đặt nhầm vị trí rồi tính x = 12·20 : 3 = 80, ' +
          'trong khi x đứng ở mẫu bên trái, đối diện với 12 trong phép nhân chéo.',
      },
      {
        prompt: 'Cho x/3 = y/5 và x + y = 40. Tìm y.',
        answer: { kind: 'numeric', value: 25 },
        explain:
          'Dãy tỉ số bằng nhau: x/3 = y/5 = (x + y)/(3 + 5) = 40/8 = 5, nên y = 5·5 = 25 (và x = 15, 15 + 25 = 40). ' +
          'Lỗi hay gặp là chia 40 cho 5 − 3 = 2, vì tử là tổng thì mẫu cũng phải là tổng 3 + 5.',
      },
      {
        prompt:
          'Mai, Nam, Hà góp tiền mua quà theo tỉ lệ 2 : 3 : 5, tổng cộng 300 000 đồng. Bạn góp nhiều nhất góp bao nhiêu đồng?',
        answer: { kind: 'numeric', value: 150000 },
        explain:
          'Gọi số tiền ba bạn là a, b, c: a/2 = b/3 = c/5 = (a + b + c)/(2 + 3 + 5) = 300 000/10 = 30 000. ' +
          'Bạn góp nhiều nhất là c = 5·30 000 = 150 000 đồng. Lỗi hay gặp là chia 300 000 cho 3 (số bạn) rồi cho rằng ai cũng góp như nhau.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tính chất cơ bản của tỉ lệ thức a/b = c/d?',
        dap: 'a·d = b·c (tích ngoại tỉ bằng tích trung tỉ).',
      },
      {
        hoi: 'Tính chất dãy tỉ số bằng nhau?',
        dap: 'a/b = c/d = (a + c)/(b + d) = (a − c)/(b − d), với các mẫu khác 0.',
      },
      {
        hoi: 'Cách viết x : y : z = 2 : 3 : 5 có nghĩa là gì?',
        dap: 'Nghĩa là x/2 = y/3 = z/5.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c6-b2',
    grade: '7',
    chapterNumber: 6,
    chapterTitle: 'Tỉ lệ thức và đại lượng tỉ lệ',
    lessonNumber: 2,
    title: 'Đại lượng tỉ lệ thuận',
    hook:
      'Một ô tô chạy đều trên cao tốc: 1 giờ đi được 55 km, 2 giờ được 110 km, 3 giờ được 165 km. Thời gian gấp đôi thì quãng đường cũng ' +
      'gấp đôi, thời gian gấp ba thì quãng đường gấp ba. Hai đại lượng "đi cùng nhịp" như vậy gọi là tỉ lệ thuận. ' +
      'Nhận ra chúng giúp em tính nhanh quãng đường, giá tiền, khối lượng mà không cần đo lại từ đầu.',
    theory:
      'ĐẠI LƯỢNG TỈ LỆ THUẬN\n' +
      'Nếu đại lượng y liên hệ với đại lượng x theo công thức y = k·x (k là hằng số khác 0) thì ta nói y tỉ lệ thuận với x theo hệ số tỉ lệ k. ' +
      'Khi đó x = (1/k)·y, tức x cũng tỉ lệ thuận với y theo hệ số tỉ lệ 1/k.\n' +
      'Ví dụ: quãng đường s = 55·t (vận tốc không đổi); số tiền mua gạo = đơn giá × số kg; khối lượng m = 7,8·V của thanh sắt (7,8 g/cm³ là khối lượng riêng).\n' +
      'VÌ SAO gọi là "thuận"? Khi x tăng gấp 2, 3, … lần thì y = kx cũng tăng gấp 2, 3, … lần, hai đại lượng đi cùng chiều và cùng nhịp.\n\n' +
      'TÍNH CHẤT\n' +
      'Nếu y tỉ lệ thuận với x thì:\n' +
      '— Tỉ số giữa hai giá trị tương ứng luôn không đổi: y₁/x₁ = y₂/x₂ = … = k.\n' +
      '— Tỉ số hai giá trị bất kì của x bằng tỉ số hai giá trị tương ứng của y: x₁/x₂ = y₁/y₂.\n\n' +
      'CÁCH GIẢI BÀI TOÁN\n' +
      '1) Xác định hai đại lượng và kiểm tra chúng tỉ lệ thuận. 2) Tìm hệ số k hoặc lập tỉ lệ thức x₁/x₂ = y₁/y₂. 3) Tính, đổi đơn vị nếu cần, rồi kiểm tra kết quả.\n' +
      'Bài toán chia: "Chia số S thành các phần tỉ lệ thuận với a, b, c" nghĩa là các phần x, y, z thoả x/a = y/b = z/c = S/(a + b + c).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng "x tăng thì y tăng" là tỉ lệ thuận. Chưa đủ: y = x + 3 cũng tăng khi x tăng, nhưng khi x gấp đôi thì y không gấp đôi. ' +
      'Phải kiểm tra y/x có không đổi không.\n' +
      '— Lập tỉ lệ ngược: x₁/x₂ = y₂/y₁ (đó là của tỉ lệ nghịch).\n' +
      '— Nhầm hệ số: nếu y = (3/2)x thì hệ số của x theo y là 2/3, không phải 3/2.\n' +
      '— Quên đổi đơn vị (phút sang giờ, gam sang kilôgam) trước khi tính.',
    workedExample: {
      problem:
        'Khối lượng m (gam) của một thanh sắt đồng chất tỉ lệ thuận với thể tích V (cm³). Thanh sắt 5 cm³ nặng 39 g. ' +
        'Tìm hệ số tỉ lệ, viết công thức của m theo V, rồi tính khối lượng thanh sắt 12 cm³.',
      steps: [
        'Vì m tỉ lệ thuận với V nên m = k·V. Khi V = 5 thì m = 39, suy ra k = 39 : 5 = 7,8.',
        'Công thức: m = 7,8·V (7,8 g/cm³ chính là khối lượng riêng của sắt).',
        'Với V = 12: m = 7,8·12 = 93,6 (g).',
        'Kiểm tra bằng tỉ lệ: V₁/V₂ = 5/12 và m₁/m₂ = 39/93,6 = 5/12 (vì 39·12 = 468 = 5·93,6). Hai tỉ số bằng nhau nên kết quả đúng.',
      ],
      answer: 'Hệ số tỉ lệ 7,8; m = 7,8·V; thanh 12 cm³ nặng 93,6 g.',
    },
    checkQuestions: [
      {
        prompt: 'Trong các công thức sau, công thức nào cho thấy y tỉ lệ thuận với x?',
        choices: [
          { id: 'a', label: 'y = 3x' },
          { id: 'b', label: 'y = x + 3' },
          { id: 'c', label: 'y = 12/x' },
          { id: 'd', label: 'y = x²' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Tỉ lệ thuận có dạng y = k·x với k khác 0, nên y = 3x đúng (k = 3). Câu b có y tăng theo x nhưng khi x gấp đôi thì y không gấp đôi (y/x thay đổi); ' +
          'câu c là tỉ lệ nghịch; câu d có y/x = x thay đổi theo x.',
      },
      {
        prompt:
          'Biết y tỉ lệ thuận với x, và khi x = 4 thì y = 6. Hệ số tỉ lệ của x theo y là bao nhiêu? ' +
          '(viết dưới dạng phân số tối giản)',
        answer: { kind: 'fraction', num: 2, den: 3, requireSimplified: true },
        explain:
          'Từ y = k·x với k = 6/4 = 3/2 suy ra x = (2/3)·y. Vậy hệ số tỉ lệ của x theo y là 2/3 (nghịch đảo của k). ' +
          'Lỗi hay gặp là trả lời 3/2, tức hệ số của y theo x, hoặc quên rút gọn 4/6.',
      },
      {
        prompt:
          'Chia 180 000 đồng cho ba bạn theo tỉ lệ thuận với 2 : 3 : 4. Bạn nhận nhiều nhất được bao nhiêu đồng?',
        answer: { kind: 'numeric', value: 80000 },
        explain:
          'Gọi ba phần là x, y, z: x/2 = y/3 = z/4 = 180 000/(2 + 3 + 4) = 20 000. Bạn nhận nhiều nhất ứng với 4: z = 4·20 000 = 80 000 đồng. ' +
          'Lỗi hay gặp là chia 180 000 cho 4 hoặc cho 3 mà quên cộng các phần 2 + 3 + 4 = 9.',
      },
      {
        prompt:
          'Một ô tô chạy đều trên cao tốc, đi 3 giờ được 165 km. Với cùng vận tốc, ô tô đi trong 4,5 giờ được bao nhiêu kilômét?',
        answer: { kind: 'numeric', value: 247.5 },
        explain:
          'Quãng đường tỉ lệ thuận với thời gian: hệ số là 165 : 3 = 55 km/h, nên 4,5 giờ đi được 55·4,5 = 247,5 km. ' +
          'Lỗi hay gặp là lập tỉ lệ ngược 165·3/4,5 = 110: đi lâu hơn mà quãng đường lại ngắn đi, vô lý.',
      },
    ],
    srsCards: [
      {
        hoi: 'y tỉ lệ thuận với x theo hệ số k nghĩa là gì?',
        dap: 'Là y = k·x với k là hằng số khác 0; khi đó y/x = k không đổi.',
      },
      {
        hoi: 'Tính chất của hai đại lượng tỉ lệ thuận?',
        dap: 'y₁/x₁ = y₂/x₂ = … = k và x₁/x₂ = y₁/y₂.',
      },
      {
        hoi: 'Nếu y = k·x thì x tỉ lệ thuận với y theo hệ số nào?',
        dap: 'Theo hệ số 1/k, vì x = (1/k)·y.',
      },
      {
        hoi: 'Chia S thành các phần tỉ lệ thuận với a, b, c thì mỗi phần tính thế nào?',
        dap: 'x/a = y/b = z/c = S/(a + b + c), rồi nhân với a, b, c để ra từng phần.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c6-b3',
    grade: '7',
    chapterNumber: 6,
    chapterTitle: 'Tỉ lệ thức và đại lượng tỉ lệ',
    lessonNumber: 3,
    title: 'Đại lượng tỉ lệ nghịch',
    hook:
      'Đoạn đường từ nhà bà đến thị trấn dài 180 km. Đi xe 60 km/h hết 3 giờ, nhưng chạy chậm 45 km/h thì phải mất 4 giờ. ' +
      'Vận tốc càng lớn thì thời gian càng ít, và tích vận tốc nhân thời gian luôn bằng 180 km, đúng độ dài quãng đường. ' +
      'Hai đại lượng mà cái này tăng thì cái kia giảm theo nhịp đó gọi là tỉ lệ nghịch. Bài này giúp em nhận ra và tính với chúng.',
    theory:
      'ĐẠI LƯỢNG TỈ LỆ NGHỊCH\n' +
      'Nếu y liên hệ với x theo công thức y = a/x (hay x·y = a, với a là hằng số khác 0) thì ta nói y tỉ lệ nghịch với x theo hệ số tỉ lệ a. ' +
      'Khi đó x = a/y, tức x cũng tỉ lệ nghịch với y theo cùng hệ số a.\n' +
      'Ví dụ: vận tốc v và thời gian t trên cùng một quãng đường s: v·t = s; số công nhân và số ngày hoàn thành cùng một công việc (năng suất mỗi người như nhau); ' +
      'số người chia và phần mỗi người nhận khi chia một số tiền cố định.\n' +
      'VÌ SAO gọi là "nghịch"? Khi x tăng gấp 2 lần thì y giảm đi 2 lần (còn một nửa), vì tích x·y = a không đổi. ' +
      'Ví dụ gấp đôi số công nhân thì thời gian làm việc giảm một nửa, vì tổng lượng công việc không đổi.\n\n' +
      'TÍNH CHẤT\n' +
      'Nếu y tỉ lệ nghịch với x thì:\n' +
      '— Tích hai giá trị tương ứng luôn không đổi: x₁·y₁ = x₂·y₂ = … = a.\n' +
      '— Tỉ số hai giá trị bất kì của x bằng nghịch đảo tỉ số hai giá trị tương ứng của y: x₁/x₂ = y₂/y₁.\n\n' +
      'BÀI TOÁN CHIA THEO TỈ LỆ NGHỊCH\n' +
      'Chia S thành các phần x, y, z tỉ lệ nghịch với a, b, c nghĩa là a·x = b·y = c·z. Chia cả ba vế cho BCNN(a, b, c) (hoặc viết x/(1/a) = y/(1/b) = z/(1/c)) ' +
      'để đưa về dãy tỉ số bằng nhau. Ví dụ chia 120 tỉ lệ nghịch với 2, 3, 6: 2x = 3y = 6z, chia cho 6 được x/3 = y/2 = z/1 = 120/6 = 20, nên x = 60, y = 40, z = 20.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm với tỉ lệ thuận: tính y = x₂·y₁/x₁ trong khi phải là y = x₁·y₁/x₂.\n' +
      '— Chia theo tỉ lệ nghịch với 2 : 3 : 6 mà lại chia luôn theo 2 : 3 : 6. Phần ứng với số nhỏ phải được nhiều hơn.\n' +
      '— Cho rằng cứ "x tăng thì y giảm" là tỉ lệ nghịch. Chưa chắc: y = 10 − x giảm khi x tăng nhưng tích x·y không là hằng số.\n' +
      '— Quên giả thiết "năng suất mỗi người như nhau" khi làm bài toán công việc.',
    workedExample: {
      problem:
        'Một đội 8 công nhân làm xong một công việc trong 15 ngày. Hỏi nếu đội có 12 công nhân (năng suất mỗi người như nhau) thì làm xong trong bao nhiêu ngày?',
      steps: [
        'Số công nhân và số ngày làm xong cùng một công việc là hai đại lượng tỉ lệ nghịch: x·y = a không đổi.',
        'Tìm hệ số tỉ lệ: a = 8·15 = 120 (tổng công việc tính theo "công nhân·ngày").',
        'Với 12 công nhân: 12·y = 120, nên y = 120 : 12 = 10 (ngày).',
        'Kiểm tra bằng tỉ số: x₁/x₂ = 8/12 = 2/3 và y₂/y₁ = 10/15 = 2/3, bằng nhau. Thêm người nên làm ít ngày hơn (10 < 15), hợp lí.',
      ],
      answer: 'Làm xong trong 10 ngày.',
    },
    checkQuestions: [
      {
        prompt: 'Cặp giá trị nào dưới đây của (x, y) cho thấy y tỉ lệ nghịch với x?',
        choices: [
          { id: 'a', label: 'x = 1; 2; 4 và y = 12; 6; 3' },
          { id: 'b', label: 'x = 1; 2; 4 và y = 12; 10; 8' },
          { id: 'c', label: 'x = 1; 2; 4 và y = 3; 6; 12' },
          { id: 'd', label: 'x = 1; 2; 4 và y = 12; 8; 4' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Tỉ lệ nghịch khi tích x·y không đổi: ở câu a, 1·12 = 2·6 = 4·3 = 12. Câu b và d có y giảm theo x nhưng tích không cố định ' +
          '(12, 20, 32 và 12, 16, 16); câu c có y/x = 3 không đổi nên là tỉ lệ thuận.',
      },
      {
        prompt: 'Biết x và y tỉ lệ nghịch. Khi x = 6 thì y = 8. Tính y khi x = 16.',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Hệ số tỉ lệ là a = 6·8 = 48, nên y = 48/16 = 3. Lỗi hay gặp là dùng tỉ lệ thuận: y = 8·16/6 ≈ 21,3; ' +
          'x tăng từ 6 lên 16 mà y còn tăng thì mâu thuẫn với tỉ lệ nghịch.',
      },
      {
        prompt:
          'Quãng đường từ nhà bà đến thị trấn dài 180 km. Đi xe 60 km/h thì hết 3 giờ. Nếu chạy chậm, vận tốc 45 km/h, thì hết bao nhiêu giờ?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Trên cùng quãng đường, vận tốc và thời gian tỉ lệ nghịch: v·t = 180. Với v = 45 thì t = 180/45 = 4 giờ. ' +
          'Lỗi hay gặp là tính 3·45/60 = 2,25 giờ, tức dùng tỉ lệ thuận; chạy chậm hơn thì phải mất nhiều giờ hơn chứ không phải ít hơn.',
      },
      {
        prompt:
          'Cô giáo chia 120 quyển vở thưởng cho ba tổ tỉ lệ nghịch với số lần vi phạm nội quy của mỗi tổ là 2, 3, 6. ' +
          'Tổ ít vi phạm nhất (2 lần) được bao nhiêu quyển?',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'Gọi ba phần là x, y, z: 2x = 3y = 6z. Chia cho BCNN = 6: x/3 = y/2 = z/1 = 120/6 = 20 nên x = 60. ' +
          'Lỗi hay gặp là chia thẳng theo 2 : 3 : 6 rồi cho tổ vi phạm nhiều nhất nhận nhiều nhất, trái với tỉ lệ nghịch.',
      },
    ],
    srsCards: [
      {
        hoi: 'y tỉ lệ nghịch với x theo hệ số a nghĩa là gì?',
        dap: 'Là y = a/x (a ≠ 0), tức x·y = a không đổi.',
      },
      {
        hoi: 'Tính chất của hai đại lượng tỉ lệ nghịch?',
        dap: 'x₁·y₁ = x₂·y₂ = … = a và x₁/x₂ = y₂/y₁.',
      },
      {
        hoi: 'Ví dụ về hai đại lượng tỉ lệ nghịch trong đời sống?',
        dap: 'Vận tốc và thời gian trên cùng một quãng đường; số công nhân và số ngày làm xong cùng một việc.',
      },
      {
        hoi: 'Cách chia một số theo tỉ lệ nghịch với 2, 3, 6?',
        dap: 'Đặt 2x = 3y = 6z rồi chia cho BCNN 6 được x/3 = y/2 = z/1, sau đó dùng tính chất dãy tỉ số bằng nhau.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
