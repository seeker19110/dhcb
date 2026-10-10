// lessons/toan9c1.ts — Toán 9, Chương 1: Phương trình và hệ hai phương trình bậc nhất hai ẩn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C1_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c1-b1',
    grade: '9',
    chapterNumber: 1,
    chapterTitle: 'Phương trình và hệ hai phương trình bậc nhất hai ẩn',
    lessonNumber: 1,
    title: 'Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn',
    hook:
      'Ở chợ, nhà An mua 2 kg cà chua và 1 kg thịt hết 130 nghìn đồng, nhà Bình mua 1 kg cà chua và 1 kg thịt hết 110 nghìn đồng. ' +
      'Nếu chỉ biết hoá đơn của nhà An thì có rất nhiều cặp giá thỏa mãn, nhưng khi có cả hai hoá đơn thì chỉ còn đúng một cặp. ' +
      'Bài này dạy em viết các hoá đơn ấy thành phương trình hai ẩn và hiểu "nghiệm của hệ" nghĩa là gì.',
    theory:
      'PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN\n' +
      'Là phương trình có dạng ax + by = c, trong đó a, b, c là các số cho trước và a, b không đồng thời bằng 0. Ví dụ 2x + y = 5; x − 3y = 4; 5y = 10.\n' +
      'Nếu có cặp số (x₀; y₀) làm cho hai vế bằng nhau khi thay x = x₀ và y = y₀ thì (x₀; y₀) gọi là một nghiệm của phương trình.\n' +
      'Chú ý: thứ tự trong cặp số có ý nghĩa. (1; 3) là nghiệm của 2x + y = 5 (vì 2 · 1 + 3 = 5) nhưng (3; 1) thì không (2 · 3 + 1 = 7).\n\n' +
      'TẬP NGHIỆM LÀ MỘT ĐƯỜNG THẲNG\n' +
      'Một phương trình bậc nhất hai ẩn có vô số nghiệm. Nếu b ≠ 0, ta viết được y = (c − ax)/b: cho x một giá trị tuỳ ý thì tính ra y tương ứng. ' +
      'Chẳng hạn 2x + y = 5 cho y = 5 − 2x, nên x = 0 được (0; 5), x = 1 được (1; 3), x = 2 được (2; 1).\n' +
      'VÌ SAO là đường thẳng? Vì y = 5 − 2x chính là hàm số bậc nhất đã học ở lớp 8, đồ thị của nó là một đường thẳng. Mọi nghiệm (x; y) đều là tọa độ của một điểm trên đường thẳng ấy và ngược lại. ' +
      'Trường hợp đặc biệt: ax = c (b = 0) cho đường thẳng song song hoặc trùng với trục tung, by = c (a = 0) cho đường thẳng song song hoặc trùng với trục hoành.\n\n' +
      'HỆ HAI PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN\n' +
      'Là hệ gồm hai phương trình bậc nhất hai ẩn mà ta cần tìm các cặp số thỏa mãn CẢ HAI phương trình cùng lúc, viết dưới dạng\n' +
      '   { ax + by = c\n' +
      '   { a′x + b′y = c′.\n' +
      'Cặp số (x₀; y₀) thỏa mãn cả hai phương trình gọi là một nghiệm của hệ. Giải hệ là tìm tất cả các nghiệm của nó.\n\n' +
      'CÁCH KIỂM MỘT CẶP SỐ CÓ LÀ NGHIỆM CỦA HỆ\n' +
      'Thay x₀, y₀ vào TỪNG phương trình. Chỉ cần một phương trình không đúng thì (x₀; y₀) không là nghiệm của hệ.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đảo thứ tự cặp số: viết (y; x) thay cho (x; y).\n' +
      '— Chỉ thay vào một phương trình rồi kết luận là nghiệm của hệ.\n' +
      '— Cho rằng phương trình hai ẩn chỉ có một nghiệm: thực ra nó có vô số nghiệm.\n' +
      '— Sai dấu khi thay số âm: với x = −2 thì 3x = −6, không phải 6.',
    workedExample: {
      problem:
        'a) Trong các cặp (1; 3) và (2; 2), cặp nào là nghiệm của phương trình 2x + y = 5? b) Viết nghiệm tổng quát của 2x + y = 5. ' +
        'c) Cặp (2; 1) có là nghiệm của hệ { 2x + y = 5 ; x − y = 1 } không?',
      steps: [
        'a) Với (1; 3): 2 · 1 + 3 = 5, đúng, nên (1; 3) là nghiệm.',
        'a) Với (2; 2): 2 · 2 + 2 = 6 khác 5, nên (2; 2) không là nghiệm.',
        'b) Rút y theo x: y = 5 − 2x. Với mỗi số x tuỳ ý ta có một nghiệm (x; 5 − 2x), tập nghiệm là đường thẳng y = 5 − 2x.',
        'c) Thay (2; 1) vào phương trình thứ nhất: 2 · 2 + 1 = 5, đúng.',
        'c) Thay (2; 1) vào phương trình thứ hai: 2 − 1 = 1, đúng.',
        'c) Cặp (2; 1) thỏa mãn cả hai phương trình nên là nghiệm của hệ.',
      ],
      answer:
        'a) (1; 3) là nghiệm, (2; 2) không. b) Nghiệm tổng quát (x; 5 − 2x) với x tuỳ ý. c) Có, (2; 1) là nghiệm của hệ.',
    },
    checkQuestions: [
      {
        prompt:
          'Cặp số (−2; y) là nghiệm của phương trình 3x + 2y = 4. Giá trị của y bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Thay x = −2: 3 · (−2) + 2y = 4, tức −6 + 2y = 4, suy ra 2y = 10 và y = 5. ' +
          'Lỗi hay gặp là tính 3 · (−2) = 6 (quên dấu âm) rồi ra y = −1.',
      },
      {
        prompt: 'Cặp số (2; −1) là nghiệm của hệ phương trình nào dưới đây?',
        choices: [
          { id: 'a', label: '{ x + y = 3 ; x − y = 1 }' },
          { id: 'b', label: '{ 2x + y = 3 ; x − y = 2 }' },
          { id: 'c', label: '{ x + 2y = 0 ; 2x − y = 5 }' },
          { id: 'd', label: '{ x + y = 1 ; 2x + y = 4 }' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Hệ c: 2 + 2 · (−1) = 0 và 2 · 2 − (−1) = 5, cả hai đều đúng. ' +
          'Hệ a sai ở phương trình đầu (2 + (−1) = 1 khác 3); hệ b và d chỉ đúng phương trình đầu (2 · 2 − 1 = 3 và 2 − 1 = 1) nhưng sai phương trình thứ hai. ' +
          'Lỗi hay gặp là chỉ thử một phương trình.',
      },
      {
        prompt: 'Biết cặp số (2; 3) là nghiệm của hệ { ax + y = 7 ; x + by = 11 }. Tính a + b.',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Thay (2; 3) vào phương trình đầu: 2a + 3 = 7 nên a = 2. Thay vào phương trình sau: 2 + 3b = 11 nên b = 3. Vậy a + b = 5. ' +
          'Lỗi hay gặp là thay nhầm x = 3, y = 2 (đảo thứ tự cặp số).',
      },
      {
        prompt:
          'Mua 3 cái bút và 2 quyển vở hết 29 nghìn đồng, gọi giá mỗi cái bút là x nghìn đồng và mỗi quyển vở là y nghìn đồng, ta có 3x + 2y = 29. ' +
          'Biết bút giá 5 nghìn đồng một cái. Giá mỗi quyển vở là bao nhiêu nghìn đồng?',
        answer: { kind: 'numeric', value: 7 },
        explain:
          'Thay x = 5: 3 · 5 + 2y = 29, suy ra 2y = 14 và y = 7 (nghìn đồng). Thử lại: 3 · 5 + 2 · 7 = 29. ' +
          'Lỗi hay gặp là lấy 29 − 15 = 14 rồi quên chia cho 2.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương trình bậc nhất hai ẩn có dạng nào?',
        dap: 'ax + by = c, với a, b không đồng thời bằng 0. Nghiệm là một cặp số (x₀; y₀) làm hai vế bằng nhau.',
      },
      {
        hoi: 'Phương trình bậc nhất hai ẩn có bao nhiêu nghiệm? Biểu diễn bằng hình gì?',
        dap: 'Có vô số nghiệm; tập nghiệm được biểu diễn bởi một đường thẳng ax + by = c trên mặt phẳng tọa độ.',
      },
      {
        hoi: 'Nghiệm của hệ hai phương trình bậc nhất hai ẩn là gì?',
        dap: 'Là cặp số (x₀; y₀) thỏa mãn đồng thời cả hai phương trình của hệ.',
      },
      {
        hoi: 'Cách kiểm cặp số (x₀; y₀) có là nghiệm của hệ không?',
        dap: 'Thay vào từng phương trình; cả hai đều đúng mới là nghiệm, chỉ một phương trình sai thì không phải.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c1-b2',
    grade: '9',
    chapterNumber: 1,
    chapterTitle: 'Phương trình và hệ hai phương trình bậc nhất hai ẩn',
    lessonNumber: 2,
    title: 'Giải hệ hai phương trình bậc nhất hai ẩn',
    hook:
      'Ở quán trà, nhóm bạn của Hà gọi 3 cốc trà và 2 chiếc bánh hết 90 nghìn đồng, nhóm bạn của Nam gọi 3 cốc trà và 1 chiếc bánh hết 75 nghìn đồng. ' +
      'Hai hoá đơn chỉ khác nhau đúng một chiếc bánh, nên lấy hoá đơn này trừ hoá đơn kia là biết ngay giá bánh. ' +
      'Đó cũng là ý tưởng của phương pháp cộng đại số, và bài này dạy em hai cách giải hệ phương trình: phương pháp thế và phương pháp cộng.',
    theory:
      'PHƯƠNG PHÁP THẾ\n' +
      'Bước 1. Từ một phương trình, rút một ẩn theo ẩn kia (chọn phương trình và ẩn có hệ số đơn giản nhất, nên là 1 hoặc −1).\n' +
      'Bước 2. Thế biểu thức vừa rút vào phương trình còn lại, được phương trình một ẩn, rồi giải.\n' +
      'Bước 3. Thay giá trị tìm được để tính ẩn còn lại, rồi thử lại vào cả hai phương trình.\n\n' +
      'PHƯƠNG PHÁP CỘNG ĐẠI SỐ\n' +
      'Bước 1. Nhân hai vế của mỗi phương trình với một số thích hợp (nếu cần) để hệ số của một ẩn nào đó trong hai phương trình bằng nhau hoặc đối nhau.\n' +
      'Bước 2. Hệ số đối nhau thì CỘNG, hệ số bằng nhau thì TRỪ từng vế hai phương trình, được phương trình một ẩn rồi giải.\n' +
      'Bước 3. Thay giá trị tìm được vào một phương trình ban đầu để tính ẩn còn lại.\n' +
      'VÌ SAO cộng (trừ) vế được? Hai đẳng thức đúng thì cộng (trừ) vế với vế cho đẳng thức đúng, nên nghiệm của hệ ban đầu vẫn là nghiệm của phương trình mới.\n\n' +
      'KHI HỆ KHÔNG CÓ ĐÚNG MỘT NGHIỆM\n' +
      'Trong lúc giải, nếu một ẩn mất đi và ta thu được:\n' +
      '— Đẳng thức sai, chẳng hạn 0 = 1: hệ VÔ NGHIỆM.\n' +
      '— Đẳng thức luôn đúng, chẳng hạn 0 = 0: hệ có VÔ SỐ NGHIỆM.\n' +
      'Ý nghĩa hình học: mỗi phương trình biểu diễn một đường thẳng. Hai đường thẳng cắt nhau: hệ có một nghiệm (tọa độ giao điểm); song song: hệ vô nghiệm; trùng nhau: hệ có vô số nghiệm.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhân một vế mà quên nhân vế còn lại (kể cả vế phải).\n' +
      '— Sai dấu khi trừ vế với vế: (3x + y) − (x + y) = 2x, nhưng 5 − (−2) = 7 chứ không phải 3.\n' +
      '— Tìm xong một ẩn rồi dừng, quên tính ẩn còn lại hoặc quên viết nghiệm dưới dạng cặp (x; y).\n' +
      '— Thấy 0x = 5 mà kết luận x = 0 thay vì "vô nghiệm".',
    workedExample: {
      problem:
        'Giải các hệ phương trình: a) { x + 2y = 7 ; 3x − y = 7 } (phương pháp thế). b) { 2x + 3y = 7 ; 4x − 3y = 5 } (phương pháp cộng). c) { x − 2y = 3 ; 2x − 4y = 5 }.',
      steps: [
        'a) Từ phương trình đầu rút x = 7 − 2y. Thế vào phương trình thứ hai: 3(7 − 2y) − y = 7, tức 21 − 7y = 7.',
        'a) Suy ra 7y = 14 nên y = 2, rồi x = 7 − 2 · 2 = 3. Thử lại: 3 + 4 = 7 và 9 − 2 = 7. Nghiệm (3; 2).',
        'b) Hệ số của y là 3 và −3, đối nhau nên cộng hai phương trình theo vế: 6x = 12, suy ra x = 2.',
        'b) Thay x = 2 vào phương trình đầu: 4 + 3y = 7 nên y = 1. Thử lại: 8 − 3 = 5. Nghiệm (2; 1).',
        'c) Nhân phương trình đầu với 2: 2x − 4y = 6. Trừ theo vế cho phương trình thứ hai: (2x − 4y) − (2x − 4y) = 6 − 5, tức 0 = 1.',
        'c) Đẳng thức 0 = 1 sai nên hệ vô nghiệm (hai đường thẳng song song).',
      ],
      answer: 'a) (3; 2). b) (2; 1). c) Hệ vô nghiệm.',
    },
    checkQuestions: [
      {
        prompt:
          'Giải hệ { x + 3y = −1 ; 2x − y = 12 }, nghiệm là cặp (x; y). Giá trị của y bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -2 },
        explain:
          'Từ phương trình thứ hai rút y = 2x − 12, thế vào phương trình đầu: x + 3(2x − 12) = −1, tức 7x − 36 = −1 nên x = 5 và y = 2 · 5 − 12 = −2. ' +
          'Thử lại: 5 + 3 · (−2) = −1. Lỗi hay gặp là bỏ ngoặc mà quên nhân 3 với −12 (viết 6x − 12 thay vì 6x − 36).',
      },
      {
        prompt: 'Hệ phương trình { x + 2y = 3 ; 2x + 4y = 7 } có bao nhiêu nghiệm?',
        choices: [
          { id: 'a', label: 'Đúng một nghiệm' },
          { id: 'b', label: 'Vô số nghiệm' },
          { id: 'c', label: 'Đúng hai nghiệm' },
          { id: 'd', label: 'Vô nghiệm' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'Nhân phương trình đầu với 2 được 2x + 4y = 6, trong khi phương trình thứ hai là 2x + 4y = 7: một biểu thức không thể vừa bằng 6 vừa bằng 7 nên hệ vô nghiệm. ' +
          'Lỗi hay gặp là thấy hai vế trái "gấp đôi nhau" và vội kết luận vô số nghiệm mà quên so sánh vế phải (6 khác 7).',
      },
      {
        prompt:
          'Giải hệ { 2x + 3y = 13 ; 3x − 2y = 0 }. Với nghiệm (x; y), tổng x + y bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Nhân phương trình đầu với 2 và phương trình sau với 3: 4x + 6y = 26 và 9x − 6y = 0. Cộng vế: 13x = 26 nên x = 2, rồi 4 + 3y = 13 cho ra y = 3. Tổng x + y = 5. ' +
          'Lỗi hay gặp là chỉ nhân các hạng tử chứa ẩn mà quên nhân vế phải (26 và 0).',
      },
      {
        prompt: 'Tìm m để hệ { x + y = 5 ; 2x + my = 10 } có vô số nghiệm.',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Nhân phương trình đầu với 2 được 2x + 2y = 10. Để hệ có vô số nghiệm thì phương trình thứ hai phải trùng với phương trình này, tức m = 2. ' +
          'Khi đó hai phương trình giống hệt nhau, trừ vế ra 0 = 0. Lỗi hay gặp là chọn m = 5 hoặc m = 10 do nhìn nhầm vế phải.',
      },
    ],
    srsCards: [
      {
        hoi: 'Các bước giải hệ bằng phương pháp thế?',
        dap: 'Rút một ẩn từ một phương trình, thế vào phương trình còn lại để được phương trình một ẩn, giải rồi tính ẩn kia và thử lại.',
      },
      {
        hoi: 'Các bước giải hệ bằng phương pháp cộng đại số?',
        dap: 'Nhân để hệ số một ẩn bằng nhau hoặc đối nhau; đối nhau thì cộng, bằng nhau thì trừ từng vế; giải ẩn còn lại rồi thay ngược.',
      },
      {
        hoi: 'Khi nào hệ vô nghiệm, khi nào vô số nghiệm?',
        dap: 'Biến đổi mà ẩn mất đi: được đẳng thức sai (0 = 1) thì vô nghiệm; được đẳng thức luôn đúng (0 = 0) thì vô số nghiệm.',
      },
      {
        hoi: 'Ý nghĩa hình học của số nghiệm của hệ hai phương trình bậc nhất hai ẩn?',
        dap: 'Hai đường thẳng cắt nhau: một nghiệm; song song: vô nghiệm; trùng nhau: vô số nghiệm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c1-b3',
    grade: '9',
    chapterNumber: 1,
    chapterTitle: 'Phương trình và hệ hai phương trình bậc nhất hai ẩn',
    lessonNumber: 3,
    title: 'Giải bài toán bằng cách lập hệ phương trình',
    hook:
      'Ở khu vui chơi, nhà An mua 2 vé người lớn và 3 vé trẻ em hết 330 nghìn đồng, nhà Bình mua 3 vé người lớn và 1 vé trẻ em hết 320 nghìn đồng. ' +
      'Muốn biết giá từng loại vé, ta có hai đại lượng chưa biết và hai dữ kiện để nối chúng với nhau. ' +
      'Bài này dạy em gọi hai ẩn, lập hệ phương trình rồi giải và kiểm tra kết quả để trả lời bài toán.',
    theory:
      'BA BƯỚC GIẢI BÀI TOÁN BẰNG CÁCH LẬP HỆ PHƯƠNG TRÌNH\n' +
      'Bước 1. Lập hệ phương trình: chọn hai ẩn (nêu rõ ẩn là gì, đơn vị, điều kiện); biểu diễn các đại lượng còn lại qua hai ẩn; tìm hai mối quan hệ để lập hai phương trình.\n' +
      'Bước 2. Giải hệ phương trình vừa lập.\n' +
      'Bước 3. Đối chiếu nghiệm với điều kiện của ẩn và của bài toán (số người, số cái phải là số nguyên dương; vận tốc phải dương…), rồi trả lời đúng điều đề hỏi.\n' +
      'VÌ SAO cần hai ẩn? Khi bài toán có hai đại lượng chưa biết độc lập, một phương trình không đủ để xác định cả hai (như đã thấy, nó có vô số nghiệm); phải có hai phương trình độc lập.\n\n' +
      'MỘT SỐ MỐI QUAN HỆ HAY GẶP\n' +
      '— Chuyển động: s = v · t. Hai xe đi ngược chiều gặp nhau thì tổng quãng đường hai xe đã đi bằng khoảng cách ban đầu. Vận tốc xuôi dòng = vận tốc riêng + vận tốc dòng nước; ngược dòng = vận tốc riêng − vận tốc dòng nước.\n' +
      '— Mua bán: tổng tiền = số lượng · đơn giá, cộng lại theo từng loại hàng.\n' +
      '— Phần trăm: tăng p% thì số mới bằng (100 + p)% số cũ; giảm p% thì bằng (100 − p)% số cũ.\n' +
      '— Năng suất: khối lượng công việc = năng suất · thời gian.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Chọn ẩn mà không nêu rõ ẩn là gì và đơn vị.\n' +
      '— Lập hai phương trình thực chất là một (cùng một mối quan hệ viết hai lần), nên hệ có vô số nghiệm.\n' +
      '— Quên đổi đơn vị (phút ra giờ, mét ra ki-lô-mét).\n' +
      '— Giải ra nghiệm rồi trả lời luôn, không kiểm tra điều kiện, hoặc trả lời một ẩn trong khi đề hỏi ẩn kia.',
    workedExample: {
      problem:
        'Hai tỉnh A và B cách nhau 150 km. Một ô tô đi từ A và một xe máy đi từ B cùng lúc, đi ngược chiều và gặp nhau sau 2 giờ. Vận tốc ô tô lớn hơn vận tốc xe máy 15 km/h. Tính vận tốc mỗi xe.',
      steps: [
        'Gọi x (km/h) là vận tốc ô tô và y (km/h) là vận tốc xe máy, điều kiện x > 0, y > 0.',
        'Ô tô nhanh hơn xe máy 15 km/h, nên x − y = 15.',
        'Sau 2 giờ ô tô đi được 2x km, xe máy đi được 2y km; hai xe đi ngược chiều gặp nhau nên 2x + 2y = 150, tức x + y = 75.',
        'Ta có hệ { x − y = 15 ; x + y = 75 }. Cộng hai phương trình theo vế: 2x = 90 nên x = 45.',
        'Thay vào x + y = 75 được y = 30.',
        'Kiểm tra: 45 và 30 đều dương, 45 − 30 = 15, và 2 · 45 + 2 · 30 = 150. Thỏa mãn đề bài.',
      ],
      answer: 'Vận tốc ô tô là 45 km/h, vận tốc xe máy là 30 km/h.',
    },
    checkQuestions: [
      {
        prompt:
          'Vừa gà vừa chó, bó lại cho tròn, ba mươi sáu con, một trăm chân chẵn. Gọi x là số gà, y là số chó. Hệ phương trình nào mô tả đúng đề bài?',
        choices: [
          { id: 'a', label: '{ x + y = 36 ; 4x + 2y = 100 }' },
          { id: 'b', label: '{ x + y = 100 ; 2x + 4y = 36 }' },
          { id: 'c', label: '{ x + y = 36 ; 2x + 4y = 100 }' },
          { id: 'd', label: '{ x + y = 36 ; 2x + 2y = 100 }' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Tổng số con là x + y = 36; gà có 2 chân, chó có 4 chân nên tổng số chân là 2x + 4y = 100. Giải ra x = 22 gà, y = 14 chó. ' +
          'Hệ a gán nhầm số chân cho hai loài, hệ b đảo số con với số chân, hệ d coi mọi con đều có 2 chân.',
      },
      {
        prompt:
          'Một ca nô đi xuôi dòng 40 km hết 2 giờ và ngược dòng 40 km hết 2,5 giờ. Vận tốc dòng nước là bao nhiêu ki-lô-mét trên giờ?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Vận tốc xuôi dòng là 40 : 2 = 20 km/h, ngược dòng là 40 : 2,5 = 16 km/h. Gọi x là vận tốc riêng của ca nô và y là vận tốc dòng nước: x + y = 20 và x − y = 16, ' +
          'trừ vế được 2y = 4 nên y = 2 (và x = 18). Lỗi hay gặp là lấy 20 − 16 = 4 làm vận tốc dòng nước, đó là gấp đôi vận tốc dòng nước.',
      },
      {
        prompt:
          'Tháng trước hai tổ sản xuất được tất cả 120 sản phẩm. Tháng này tổ I làm vượt 10% và tổ II làm vượt 20% so với tháng trước, nên cả hai tổ làm được 136 sản phẩm. ' +
          'Tháng trước tổ I làm được bao nhiêu sản phẩm?',
        answer: { kind: 'numeric', value: 80 },
        explain:
          'Gọi x, y là số sản phẩm của tổ I, tổ II tháng trước: x + y = 120 và 1,1x + 1,2y = 136. Từ phương trình đầu x = 120 − y, thế vào được 132 + 0,1y = 136 nên y = 40 và x = 80. ' +
          'Thử lại: 1,1 · 80 + 1,2 · 40 = 88 + 48 = 136. Lỗi hay gặp là viết tăng 10% thành 0,1x thay vì 1,1x.',
      },
      {
        prompt:
          'Lớp 9A mua 40 quyển vở gồm hai loại: loại I giá 8 nghìn đồng một quyển, loại II giá 5 nghìn đồng một quyển, tổng cộng hết 290 nghìn đồng. Lớp đã mua bao nhiêu quyển vở loại I?',
        answer: { kind: 'numeric', value: 30 },
        explain:
          'Gọi x, y là số vở loại I, loại II: x + y = 40 và 8x + 5y = 290. Thế y = 40 − x được 8x + 200 − 5x = 290 nên 3x = 90 và x = 30 (khi đó y = 10, đều là số nguyên dương). ' +
          'Lỗi hay gặp là trả lời y = 10, tức là số vở loại II trong khi đề hỏi loại I.',
      },
    ],
    srsCards: [
      {
        hoi: 'Ba bước giải bài toán bằng cách lập hệ phương trình?',
        dap: 'Lập hệ (chọn hai ẩn, điều kiện, lập hai phương trình); giải hệ; đối chiếu điều kiện rồi trả lời đúng câu hỏi.',
      },
      {
        hoi: 'Hai xe đi ngược chiều gặp nhau thì quãng đường liên hệ ra sao?',
        dap: 'Tổng quãng đường hai xe đã đi bằng khoảng cách ban đầu giữa hai xe (s = v · t cho từng xe).',
      },
      {
        hoi: 'Vận tốc xuôi dòng và ngược dòng tính thế nào?',
        dap: 'Xuôi dòng = vận tốc riêng + vận tốc dòng nước; ngược dòng = vận tốc riêng − vận tốc dòng nước.',
      },
      {
        hoi: 'Tăng p% hoặc giảm p% thì số mới bằng bao nhiêu phần trăm số cũ?',
        dap: 'Tăng p%: bằng (100 + p)% số cũ. Giảm p%: bằng (100 − p)% số cũ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
