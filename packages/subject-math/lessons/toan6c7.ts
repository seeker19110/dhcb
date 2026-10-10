// lessons/toan6c7.ts — Toán 6, Chương 7: Số thập phân.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C7_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c7-b1',
    grade: '6',
    chapterNumber: 7,
    chapterTitle: 'Số thập phân',
    lessonNumber: 1,
    title: 'Số thập phân và các phép tính với số thập phân',
    hook:
      'Sáng sớm ở Sa Pa, nhiệt kế chỉ −2,5 °C. Đến trưa trời nắng, nhiệt độ tăng thêm 4,8 °C. ' +
      'Muốn biết nhiệt độ lúc trưa, ta phải cộng một số thập phân âm với một số thập phân dương. ' +
      'Trong bài này em sẽ học cách so sánh và tính toán với các số thập phân, kể cả khi chúng âm.',
    theory:
      'SỐ THẬP PHÂN VÀ SỐ THẬP PHÂN ÂM\n' +
      'Số thập phân có phần nguyên và phần thập phân ngăn cách bằng dấu phẩy, như 3,14 hay 0,05. ' +
      'Số thập phân âm có dấu "−" đứng trước, như −2,5. Hai số chỉ khác nhau về dấu như 2,5 và −2,5 gọi là hai số đối nhau. ' +
      'Giá trị tuyệt đối của số thập phân là khoảng cách từ số đó đến 0 trên trục số: |−2,5| = 2,5.\n\n' +
      'SO SÁNH SỐ THẬP PHÂN\n' +
      '— Số âm < 0 < số dương.\n' +
      '— Hai số dương: so phần nguyên trước; nếu bằng nhau thì so từng chữ số thập phân từ trái sang phải ' +
      '(hàng phần mười, phần trăm, …). Ví dụ 0,4 > 0,35 vì ở hàng phần mười 4 > 3.\n' +
      '— Hai số âm: số nào có giá trị tuyệt đối lớn hơn thì nhỏ hơn. Ví dụ −2,7 < −2,3 vì 2,7 > 2,3.\n' +
      'VÌ SAO? Trên trục số, số âm càng xa 0 về bên trái thì càng nhỏ.\n\n' +
      'CỘNG, TRỪ SỐ THẬP PHÂN\n' +
      'Viết các số sao cho dấu phẩy thẳng cột rồi cộng, trừ như số nguyên. Quy tắc dấu giống số nguyên: ' +
      'cộng hai số cùng dấu thì cộng giá trị tuyệt đối, giữ dấu chung; khác dấu thì lấy giá trị tuyệt đối lớn trừ nhỏ, ' +
      'lấy dấu của số có giá trị tuyệt đối lớn hơn. Trừ một số bằng cộng với số đối của nó.\n' +
      'Ví dụ: −2,5 + 4,8 = +(4,8 − 2,5) = 2,3.\n\n' +
      'NHÂN, CHIA SỐ THẬP PHÂN\n' +
      '— Nhân: bỏ dấu phẩy, nhân như số nguyên, rồi đặt dấu phẩy ở tích sao cho số chữ số thập phân bằng tổng số chữ số ' +
      'thập phân của hai thừa số. Hai số cùng dấu cho tích dương, khác dấu cho tích âm.\n' +
      'Ví dụ: 3,4 · 0,25: 34 · 25 = 850; hai thừa số có 1 + 2 = 3 chữ số thập phân nên 3,4 · 0,25 = 0,850 = 0,85.\n' +
      '— Chia: nhân cả số bị chia và số chia với 10, 100, … để số chia thành số nguyên rồi chia. ' +
      'Ví dụ 7,2 : 0,6 = 72 : 6 = 12. Quy tắc dấu giống phép nhân.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng 0,35 > 0,4 vì 35 > 4. Phải so cùng hàng: 0,35 và 0,40, khi đó 0,40 lớn hơn.\n' +
      '— Cho rằng −2,7 > −2,3 vì 2,7 > 2,3. Với số âm thì ngược lại.\n' +
      '— Cộng trừ mà không đặt thẳng dấu phẩy.\n' +
      '— Nhân xong đặt sai dấu phẩy, hoặc quên dấu âm của kết quả.',
    workedExample: {
      problem: 'Tính −2,5 + 4,8 − (−1,25). Sau đó tính (−7,2) : 0,6.',
      steps: [
        'Trừ một số bằng cộng với số đối: −2,5 + 4,8 − (−1,25) = −2,5 + 4,8 + 1,25.',
        'Cộng hai số đầu: −2,5 + 4,8 = 2,3 (khác dấu, lấy 4,8 − 2,5, dấu của số có giá trị tuyệt đối lớn hơn là dương).',
        'Cộng tiếp: 2,3 + 1,25 = 3,55 (đặt thẳng dấu phẩy: 2,30 + 1,25).',
        'Với (−7,2) : 0,6, nhân cả hai số với 10 để số chia thành số nguyên: (−72) : 6.',
        'Hai số khác dấu nên thương âm: (−72) : 6 = −12.',
      ],
      answer: '−2,5 + 4,8 − (−1,25) = 3,55; (−7,2) : 0,6 = −12.',
    },
    checkQuestions: [
      {
        prompt: 'Trong các số 0,35; 0,4; −0,5 và −0,45, số nào nhỏ nhất?',
        choices: [
          { id: 'a', label: '0,35' },
          { id: 'b', label: '0,4' },
          { id: 'c', label: '−0,5' },
          { id: 'd', label: '−0,45' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Số âm luôn nhỏ hơn số dương nên chỉ xét −0,5 và −0,45. Với hai số âm, số có giá trị tuyệt đối lớn hơn thì nhỏ hơn: ' +
          '0,5 > 0,45 nên −0,5 < −0,45. Lỗi hay gặp là chọn −0,45 vì thấy 0,45 "nhìn nhỏ hơn".',
      },
      {
        prompt:
          'Buổi sáng nhiệt độ là −2,5 °C. Đến trưa nhiệt độ tăng thêm 4,8 °C. ' +
          'Nhiệt độ lúc trưa là bao nhiêu °C (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: 2.3 },
        explain:
          'Nhiệt độ trưa là −2,5 + 4,8. Hai số khác dấu nên lấy 4,8 − 2,5 = 2,3, mang dấu dương vì 4,8 có giá trị tuyệt đối lớn hơn. ' +
          'Lỗi hay gặp là cộng hai giá trị thành 7,3 hoặc đặt dấu âm cho kết quả.',
      },
      {
        prompt: 'Tính (−7,2) : 0,6 (nhập số âm nếu có).',
        answer: { kind: 'numeric', value: -12 },
        explain:
          'Nhân số bị chia và số chia với 10: (−72) : 6 = −12. Hai số khác dấu nên thương âm. ' +
          'Lỗi hay gặp là bỏ dấu phẩy sai chỗ, được 120 hoặc 1,2, hoặc quên dấu âm.',
      },
      {
        prompt:
          'Cô Lan mua 2,5 kg cam, giá 32,4 nghìn đồng một kilôgam. ' +
          'Cô phải trả tất cả bao nhiêu nghìn đồng?',
        answer: { kind: 'numeric', value: 81 },
        explain:
          'Số tiền là 32,4 · 2,5. Tính 324 · 25 = 8 100; hai thừa số có 1 + 1 = 2 chữ số thập phân nên được 81,00 = 81 (nghìn đồng). ' +
          'Lỗi hay gặp là đặt dấu phẩy sai, được 810 hoặc 8,1.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai số thập phân âm, số nào nhỏ hơn?',
        dap: 'Số có giá trị tuyệt đối lớn hơn thì nhỏ hơn. Ví dụ −2,7 < −2,3.',
      },
      {
        hoi: 'Muốn cộng, trừ số thập phân cần chú ý gì?',
        dap: 'Đặt các số sao cho dấu phẩy thẳng cột, rồi tính như số nguyên và áp dụng quy tắc dấu.',
      },
      {
        hoi: 'Muốn nhân hai số thập phân thì đặt dấu phẩy ở tích thế nào?',
        dap: 'Nhân như số nguyên, rồi đếm tổng số chữ số thập phân của hai thừa số để đặt dấu phẩy ở tích.',
      },
      {
        hoi: 'Làm sao chia cho số thập phân như 7,2 : 0,6?',
        dap: 'Nhân số bị chia và số chia với 10, 100, … để số chia thành số nguyên: 72 : 6 = 12.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c7-b2',
    grade: '6',
    chapterNumber: 7,
    chapterTitle: 'Số thập phân',
    lessonNumber: 2,
    title: 'Làm tròn và ước lượng',
    hook:
      'Mẹ đi chợ mua ba món có giá 19 800 đồng, 49 500 đồng và 30 200 đồng. Trước khi trả tiền, mẹ nhẩm ngay: ' +
      '"khoảng 100 nghìn", để biết mình mang đủ tiền hay chưa. Mẹ vừa làm tròn từng giá tiền rồi ước lượng tổng. ' +
      'Chiều cao 1,5748 m cũng thường được nói gọn là "khoảng 1,57 m". Bài này dạy cách làm tròn và ước lượng đúng quy tắc.',
    theory:
      'QUY TẮC LÀM TRÒN SỐ\n' +
      'Muốn làm tròn một số đến một hàng nào đó, ta nhìn chữ số NGAY BÊN PHẢI hàng cần làm tròn:\n' +
      '— Nếu chữ số đó nhỏ hơn 5: giữ nguyên chữ số ở hàng làm tròn, bỏ các chữ số sau nó.\n' +
      '— Nếu chữ số đó lớn hơn hoặc bằng 5: tăng chữ số ở hàng làm tròn thêm 1 đơn vị, bỏ các chữ số sau nó.\n' +
      'Với số nguyên, các chữ số bị bỏ được thay bằng chữ số 0.\n' +
      'Ví dụ: 12,3478 làm tròn đến hàng phần trăm: chữ số bên phải hàng phần trăm là 7 ≥ 5 nên được 12,35. ' +
      'Làm tròn 7,846 đến hàng phần mười: chữ số bên phải là 4 < 5 nên được 7,8. ' +
      'Làm tròn 49 500 đến hàng chục nghìn: chữ số hàng nghìn là 9 ≥ 5 nên được 50 000.\n' +
      'VÌ SAO có mốc 5? Chữ số bị bỏ từ 5 trở lên nghĩa là số đã nằm gần mốc tròn kế tiếp hơn mốc trước đó, nên ta lấy mốc kế tiếp.\n' +
      'Trường hợp đặc biệt: 5,996 làm tròn đến hàng phần trăm: chữ số bên phải là 6 ≥ 5 nên 5,99 tăng thêm 0,01 được 6,00 (viết gọn là 6). ' +
      'Phép "nhớ" lan sang hàng bên trái.\n\n' +
      'ƯỚC LƯỢNG KẾT QUẢ PHÉP TÍNH\n' +
      'Muốn ước lượng kết quả, ta làm tròn các số hạng (hoặc các thừa số) đến hàng cao rồi tính nhẩm. ' +
      'Ví dụ: 19,8 · 5,1 ≈ 20 · 5 = 100 (kết quả đúng là 100,98). Ước lượng giúp phát hiện nhanh kết quả sai, ' +
      'chẳng hạn máy tính cho 1009,8 là sai vì lệch hẳn khỏi 100.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Làm tròn nhiều lần liên tiếp: làm tròn 4,449 đến hàng phần mười mà đi qua 4,45 rồi 4,5 là sai. ' +
      'Đúng: nhìn chữ số bên phải hàng phần mười là 4 < 5 nên được 4,4.\n' +
      '— Nhìn nhầm chữ số: lấy chữ số ở hàng cần làm tròn thay vì chữ số bên phải nó.\n' +
      '— Quên thay chữ số bị bỏ bằng 0 khi làm tròn số nguyên: làm tròn 4 738 đến hàng trăm là 4 700, không phải 47.\n' +
      '— Làm tròn ở các bước tính trung gian quá thô khiến kết quả lệch nhiều.',
    workedExample: {
      problem:
        'a) Làm tròn 12,3478 đến hàng phần trăm. b) Ước lượng tích 19,8 · 5,1 bằng cách làm tròn các thừa số đến hàng đơn vị.',
      steps: [
        'Hàng phần trăm của 12,3478 là chữ số 4 (12,34...). Chữ số ngay bên phải là 7.',
        'Vì 7 ≥ 5 nên tăng chữ số 4 thêm 1 được 5, bỏ phần còn lại: 12,3478 ≈ 12,35.',
        'Làm tròn các thừa số đến hàng đơn vị: 19,8 ≈ 20 (chữ số thập phân 8 ≥ 5) và 5,1 ≈ 5 (chữ số thập phân 1 < 5).',
        'Ước lượng: 19,8 · 5,1 ≈ 20 · 5 = 100. Đối chiếu với kết quả đúng 100,98, sai lệch rất nhỏ.',
      ],
      answer: '12,3478 ≈ 12,35; 19,8 · 5,1 ≈ 100.',
    },
    checkQuestions: [
      {
        prompt: 'Làm tròn 7,846 đến hàng phần mười (nhập kết quả).',
        answer: { kind: 'numeric', value: 7.8 },
        explain:
          'Hàng phần mười là chữ số 8. Chữ số ngay bên phải là 4 < 5 nên giữ nguyên 8 và bỏ phần sau: 7,8. ' +
          'Lỗi hay gặp là làm tròn liên tiếp 7,846 thành 7,85 rồi 7,9, hoặc nhìn nhầm chữ số 6 ở cuối.',
      },
      {
        prompt: 'Làm tròn 5,996 đến hàng phần trăm (nhập kết quả).',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Hàng phần trăm là chữ số 9 (5,99...). Chữ số bên phải là 6 ≥ 5 nên 5,99 tăng thêm 0,01 thành 6,00, tức là 6. ' +
          'Lỗi hay gặp là viết 5,910 hoặc 5,100 vì quên rằng 9 tăng 1 thì nhớ sang hàng bên trái.',
      },
      {
        prompt:
          'Ước lượng giá trị biểu thức 4,9 · 7,2 + 2,1 bằng cách làm tròn các số đến hàng đơn vị. ' +
          'Kết quả ước lượng là số nào?',
        choices: [
          { id: 'a', label: '30' },
          { id: 'b', label: '37' },
          { id: 'c', label: '45' },
          { id: 'd', label: '52' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Làm tròn: 4,9 ≈ 5, 7,2 ≈ 7, 2,1 ≈ 2 nên ước lượng 5 · 7 + 2 = 37. Kết quả đúng là 37,38, rất gần 37. ' +
          'Lỗi hay gặp là cộng trước rồi mới nhân, được 5 · (7 + 2) = 45; phải nhân trước, cộng sau.',
      },
      {
        prompt:
          'Mẹ mua ba món hàng giá 19 800 đồng, 49 500 đồng và 30 200 đồng. Làm tròn mỗi giá đến hàng chục nghìn ' +
          'rồi ước lượng tổng số tiền phải trả (đơn vị đồng).',
        answer: { kind: 'numeric', value: 100000 },
        explain:
          'Làm tròn đến hàng chục nghìn: 19 800 ≈ 20 000 (hàng nghìn là 9 ≥ 5), 49 500 ≈ 50 000 (hàng nghìn là 9 ≥ 5), ' +
          '30 200 ≈ 30 000 (hàng nghìn là 0 < 5). Tổng ≈ 100 000 đồng (đúng là 99 500). Lỗi hay gặp là làm tròn 49 500 thành 40 000.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc làm tròn số đến một hàng nào đó?',
        dap: 'Nhìn chữ số ngay bên phải hàng cần làm tròn: nhỏ hơn 5 thì giữ nguyên, từ 5 trở lên thì tăng 1; bỏ các chữ số sau.',
      },
      {
        hoi: 'Vì sao không được làm tròn nhiều lần liên tiếp?',
        dap: 'Vì có thể sai: 4,449 làm tròn phần mười phải là 4,4 (nhìn chữ số 4), không phải 4,45 rồi 4,5.',
      },
      {
        hoi: 'Làm tròn 5,996 đến hàng phần trăm được bao nhiêu?',
        dap: '6,00 (viết gọn là 6), vì 5,99 tăng thêm 0,01 và nhớ sang hàng đơn vị.',
      },
      {
        hoi: 'Ước lượng kết quả phép tính để làm gì?',
        dap: 'Để kiểm tra nhanh kết quả có hợp lí không, bằng cách làm tròn các số rồi tính nhẩm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c7-b3',
    grade: '6',
    chapterNumber: 7,
    chapterTitle: 'Số thập phân',
    lessonNumber: 3,
    title: 'Tỉ số và tỉ số phần trăm',
    hook:
      'Cửa hàng giày treo biển "Giảm giá 20%". Đôi giày em thích giá 450 000 đồng. Giảm 20% là bớt đi bao nhiêu tiền, ' +
      'và em phải trả bao nhiêu? Ngân hàng nói lãi suất tiết kiệm 6% một năm, bản đồ ghi tỉ lệ 1 : 1 000 000. ' +
      'Phần trăm và tỉ số xuất hiện ở khắp nơi trong đời sống, và bài này giúp em hiểu chính xác các con số ấy.',
    theory:
      'TỈ SỐ\n' +
      'Thương của phép chia số a cho số b (b ≠ 0) gọi là tỉ số của a và b, viết là a : b hoặc a/b. ' +
      'Khi hai đại lượng cùng loại thì phải đổi về cùng đơn vị trước khi lập tỉ số. ' +
      'Ví dụ: tỉ số của 30 cm và 1,5 m là 30 : 150 = 1/5, chứ không phải 30 : 1,5.\n\n' +
      'TỈ SỐ PHẦN TRĂM\n' +
      'Tỉ số phần trăm của a và b là a/b · 100%. Ví dụ lớp có 40 bạn, 14 bạn đạt học sinh giỏi: ' +
      '14/40 · 100% = 35%. "35%" nghĩa là cứ 100 phần thì có 35 phần. Tỉ số phần trăm có thể lớn hơn 100%.\n\n' +
      'HAI BÀI TOÁN VỀ PHẦN TRĂM\n' +
      '1) Tìm giá trị p% của một số a: a · p/100. Ví dụ 30% của 250 000 là 250 000 · 30/100 = 75 000.\n' +
      '2) Tìm một số biết p% của nó bằng b: b · 100/p (hay b : p/100). Ví dụ 40% của một số bằng 28 thì số đó là 28 · 100/40 = 70.\n' +
      'Hai bài toán này chính là hai bài toán về phân số với p/100: có số gốc thì nhân, có phần thì chia.\n\n' +
      'ỨNG DỤNG\n' +
      '— Giảm giá p%: giá mới = giá cũ · (100 − p)/100. Ví dụ giảm 20% đôi giày 450 000 đồng: 450 000 · 80/100 = 360 000 đồng. ' +
      'VÌ SAO nhân với 80/100? Giảm 20% nghĩa là em chỉ còn trả 100% − 20% = 80% giá cũ.\n' +
      '— Lãi suất đơn giản: tiền lãi = số tiền gửi · lãi suất · số kì hạn. Lãi đơn giản không cộng lãi vào gốc để tính lãi kì sau. ' +
      'Ví dụ gửi 20 triệu đồng, lãi 6% một năm, sau 2 năm lãi là 20 000 000 · 0,06 · 2 = 2 400 000 đồng.\n' +
      '— Tỉ lệ bản đồ: tỉ lệ 1 : 1 000 000 nghĩa là 1 cm trên bản đồ ứng với 1 000 000 cm = 10 km ngoài thực tế. ' +
      'Khoảng cách thực = khoảng cách trên bản đồ · mẫu số của tỉ lệ, rồi đổi đơn vị cho phù hợp.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên đổi về cùng đơn vị khi lập tỉ số.\n' +
      '— Nhầm "giảm 20%" thành "còn lại 20%" nên lấy giá cũ · 20/100.\n' +
      '— Nhầm hai dạng bài toán: nhân khi cần chia, hoặc ngược lại.\n' +
      '— Đổi đơn vị sai khi dùng tỉ lệ bản đồ: 1 000 000 cm là 10 km chứ không phải 1 000 km.',
    workedExample: {
      problem:
        'a) Lớp 6A có 40 bạn, trong đó 14 bạn đạt học sinh giỏi. Tính tỉ số phần trăm số học sinh giỏi so với cả lớp. ' +
        'b) Một đôi giày giá 450 000 đồng được giảm giá 20%. Em phải trả bao nhiêu tiền?',
      steps: [
        'Tỉ số phần trăm: 14/40 · 100% = 0,35 · 100% = 35%.',
        'Giảm giá 20% nghĩa là chỉ còn phải trả 100% − 20% = 80% giá cũ.',
        'Số tiền phải trả: 450 000 · 80/100 = 450 000 · 0,8 = 360 000 (đồng).',
        'Cách kiểm tra: số tiền được giảm là 450 000 · 20/100 = 90 000 đồng, và 450 000 − 90 000 = 360 000 đồng, khớp kết quả.',
      ],
      answer: 'a) 35%; b) 360 000 đồng.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong kho có một số gạo. Biết 25% số gạo đó là 30 kg. Muốn tìm số gạo trong kho, ta làm phép tính nào?',
        choices: [
          { id: 'a', label: '30 · 25 : 100' },
          { id: 'b', label: '30 · 100 : 25' },
          { id: 'c', label: '25 : 100 : 30' },
          { id: 'd', label: '(100 − 25) · 30' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Đề cho phần (30 kg ứng với 25%) và hỏi số gốc nên chia: 30 : 25/100 = 30 · 100/25 = 120 (kg). ' +
          'Phép 30 · 25 : 100 là lỗi hay gặp, tức là đi tìm 25% của 30 chứ không phải tìm số gốc.',
      },
      {
        prompt:
          'Một chiếc áo giá 250 000 đồng được giảm giá 30%. Giá phải trả sau khi giảm là bao nhiêu đồng?',
        answer: { kind: 'numeric', value: 175000 },
        explain:
          'Giảm 30% nghĩa là phải trả 100% − 30% = 70% giá cũ: 250 000 · 70/100 = 175 000 (đồng). ' +
          'Lỗi hay gặp là chỉ tính được số tiền giảm 75 000 đồng rồi dừng lại, hoặc nhân với 30% thay vì 70%.',
      },
      {
        prompt:
          'Bác Hùng gửi tiết kiệm 20 000 000 đồng với lãi suất 6% một năm, tính theo lãi đơn giản ' +
          '(lãi không được cộng vào gốc). Sau 2 năm, tiền lãi bác nhận được là bao nhiêu đồng?',
        answer: { kind: 'numeric', value: 2400000 },
        explain:
          'Lãi mỗi năm là 20 000 000 · 6/100 = 1 200 000 đồng. Hai năm lãi là 1 200 000 · 2 = 2 400 000 đồng. ' +
          'Lỗi hay gặp là quên nhân với số năm, hoặc nhầm tiền lãi với tổng số tiền cả gốc lẫn lãi.',
      },
      {
        prompt:
          'Trên bản đồ tỉ lệ 1 : 1 000 000, khoảng cách giữa hai thành phố là 7,5 cm. ' +
          'Khoảng cách thực tế giữa hai thành phố là bao nhiêu kilômét?',
        answer: { kind: 'numeric', value: 75 },
        explain:
          'Khoảng cách thực là 7,5 · 1 000 000 = 7 500 000 cm. Đổi: 1 km = 100 000 cm nên 7 500 000 cm = 75 km. ' +
          'Lỗi hay gặp là đổi sai đơn vị, ra 750 km hoặc 7,5 km, vì nhầm số chữ số 0 khi đổi từ cm sang km.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tỉ số phần trăm của a và b tính thế nào?',
        dap: 'a/b · 100%. Hai đại lượng phải cùng đơn vị.',
      },
      {
        hoi: 'Giảm giá p% thì giá mới bằng bao nhiêu?',
        dap: 'Giá mới = giá cũ · (100 − p)/100, vì chỉ còn phải trả (100 − p)% giá cũ.',
      },
      {
        hoi: 'Tìm một số biết p% của nó bằng b?',
        dap: 'Số đó bằng b · 100/p (chia cho p/100).',
      },
      {
        hoi: 'Tỉ lệ bản đồ 1 : 1 000 000 nghĩa là gì?',
        dap: '1 cm trên bản đồ ứng với 1 000 000 cm = 10 km ngoài thực tế.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
