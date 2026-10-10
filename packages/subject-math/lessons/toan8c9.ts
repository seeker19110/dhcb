// lessons/toan8c9.ts — Toán 8, Chương 9: Tam giác đồng dạng.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C9_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c9-b1',
    grade: '8',
    chapterNumber: 9,
    chapterTitle: 'Tam giác đồng dạng',
    lessonNumber: 1,
    title: 'Tam giác đồng dạng và các trường hợp đồng dạng',
    hook:
      'Anh kiến trúc sư làm một mô hình khung kèo mái nhà thu nhỏ theo tỉ lệ 1 : 50. Mô hình nhỏ hơn nhiều, nhưng mái dốc thế nào thì mô hình dốc y như vậy: các góc giữ nguyên, các cạnh đều nhỏ đi 50 lần. ' +
      'Hai tam giác “giống hệt về hình dạng, chỉ khác kích thước” gọi là hai tam giác đồng dạng. ' +
      'Bài này học định nghĩa, tỉ số đồng dạng và ba cách nhanh để nhận biết hai tam giác đồng dạng.',
    theory:
      'HAI TAM GIÁC ĐỒNG DẠNG\n' +
      'Tam giác ABC đồng dạng với tam giác DEF, viết ΔABC ∽ ΔDEF, nếu ba góc tương ứng bằng nhau và ba cạnh tương ứng tỉ lệ:\n' +
      '  ∠A = ∠D, ∠B = ∠E, ∠C = ∠F và AB/DE = BC/EF = CA/FD = k.\n' +
      'Số k gọi là tỉ số đồng dạng. Các đỉnh phải viết theo thứ tự tương ứng (A↔D, B↔E, C↔F).\n' +
      '— Tỉ số đồng dạng k = 1 thì hai tam giác bằng nhau. Nếu ΔABC ∽ ΔDEF theo tỉ số k thì ΔDEF ∽ ΔABC theo tỉ số 1/k.\n' +
      '— Hai tam giác cùng đồng dạng với tam giác thứ ba thì đồng dạng với nhau.\n' +
      '— Tỉ số chu vi của hai tam giác đồng dạng bằng tỉ số đồng dạng k, vì mỗi cạnh đều nhân với k.\n\n' +
      'ĐỊNH LÍ NỀN TẢNG\n' +
      'Đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại tạo ra một tam giác mới đồng dạng với tam giác đã cho. Vì sao? Nếu MN // BC thì ∠AMN = ∠B (đồng vị), ∠ANM = ∠C, có chung góc A, và theo hệ quả định lí Thalès AM/AB = AN/AC = MN/BC. Vậy ΔAMN ∽ ΔABC.\n\n' +
      'BA TRƯỜNG HỢP ĐỒNG DẠNG\n' +
      '— Cạnh – cạnh – cạnh (c.c.c): ba cạnh của tam giác này tỉ lệ với ba cạnh của tam giác kia: AB/DE = BC/EF = CA/FD.\n' +
      '— Cạnh – góc – cạnh (c.g.c): hai cạnh của tam giác này tỉ lệ với hai cạnh của tam giác kia và hai GÓC XEN GIỮA bằng nhau.\n' +
      '— Góc – góc (g.g): hai góc của tam giác này lần lượt bằng hai góc của tam giác kia. Góc thứ ba tự động bằng nhau vì tổng ba góc là 180°.\n' +
      'Vì sao chỉ cần vài điều kiện? Cũng như trường hợp bằng nhau, khi đã cố định hình dạng bởi các điều kiện trên thì chỉ còn một cách “phóng to hoặc thu nhỏ”, nên mọi tam giác thoả điều kiện đều đồng dạng.\n\n' +
      'CÁCH TÌM TỈ SỐ ĐỒNG DẠNG\n' +
      'Sắp xếp ba cạnh mỗi tam giác từ nhỏ đến lớn rồi chia các cạnh cùng thứ tự: cạnh nhỏ nhất với cạnh nhỏ nhất, lớn nhất với lớn nhất.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Lập tỉ số các cạnh không tương ứng (cạnh ngắn của tam giác này với cạnh dài của tam giác kia).\n' +
      '— Dùng c.g.c nhưng góc đã cho KHÔNG xen giữa hai cạnh tỉ lệ.\n' +
      '— Viết sai thứ tự đỉnh trong ΔABC ∽ ΔDEF nên suy ra sai các cặp góc và cạnh.\n' +
      '— Nhầm k với 1/k, tức không để ý tam giác nào là tử số.',
    workedExample: {
      problem:
        'Tam giác ABC có AB = 4 cm, BC = 6 cm, CA = 8 cm. Tam giác DEF có DE = 6 cm, EF = 9 cm, FD = 12 cm. Chứng minh ΔABC ∽ ΔDEF, tìm tỉ số đồng dạng và tính chu vi tam giác DEF.',
      steps: [
        'Xét ba tỉ số các cạnh tương ứng: AB/DE = 4/6 = 2/3; BC/EF = 6/9 = 2/3; CA/FD = 8/12 = 2/3.',
        'Ba tỉ số bằng nhau nên ΔABC ∽ ΔDEF (c.c.c), tỉ số đồng dạng k = 2/3.',
        'Chu vi tam giác ABC là 4 + 6 + 8 = 18 cm. Tỉ số chu vi bằng k nên chu vi ABC : chu vi DEF = 2/3.',
        'Suy ra chu vi DEF = 18 × 3 : 2 = 27 cm. Kiểm tra: 6 + 9 + 12 = 27 cm.',
      ],
      answer: 'ΔABC ∽ ΔDEF (c.c.c) với k = 2/3; chu vi DEF = 27 cm.',
    },
    checkQuestions: [
      {
        prompt: 'ΔABC ∽ ΔDEF theo tỉ số đồng dạng 2/5 và BC = 8 cm. Tính EF (đơn vị cm).',
        answer: { kind: 'numeric', value: 20 },
        explain:
          'BC/EF = 2/5 nên EF = 8 × 5 : 2 = 20 cm. Lỗi hay gặp là nhân 8 với 2/5 ra 3,2 vì đảo vai trò của hai tam giác (nhầm k với 1/k).',
      },
      {
        prompt: 'Cặp tam giác nào sau đây đồng dạng?',
        choices: [
          { id: 'a', label: 'ΔABC có ∠A = 40°, ∠B = 60°; ΔDEF có ∠D = 60°, ∠E = 80°' },
          { id: 'b', label: 'ΔABC có ∠A = 50°, ∠B = 60°; ΔDEF có ∠D = 50°, ∠E = 50°' },
          { id: 'c', label: 'ΔABC có ∠A = 90°, ∠B = 30°; ΔDEF có ∠D = 90°, ∠E = 40°' },
          { id: 'd', label: 'ΔABC có ∠A = 70°, ∠B = 60°; ΔDEF có ∠D = 70°, ∠E = 70°' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Ở phương án a, ΔABC có các góc 40°, 60°, 80° và ΔDEF có các góc 60°, 80°, 40°: hai tam giác có cùng bộ ba góc nên đồng dạng (g.g). Ở b, c, d bộ ba góc khác nhau; lỗi hay gặp là chỉ so một cặp góc cùng tên.',
      },
      {
        prompt:
          'Khung kèo mái nhà ABC có AB = 5 m, AC = 5 m, BC = 6 m. Người ta làm mô hình DEF đồng dạng với ABC theo tỉ lệ 1 : 50 (mô hình nhỏ hơn). Tính chu vi mô hình (đơn vị cm).',
        answer: { kind: 'numeric', value: 32 },
        explain:
          'Chu vi khung kèo là 16 m = 1600 cm. Tỉ số chu vi bằng tỉ số đồng dạng nên chu vi mô hình là 1600 : 50 = 32 cm. Lỗi hay gặp là quên đổi mét sang xăng-ti-mét, ra 16 : 50 = 0,32.',
      },
      {
        prompt:
          'Tam giác ABC có M thuộc AB, N thuộc AC, MN // BC. Biết AM = 4 cm, AB = 10 cm, BC = 25 cm. Tính MN (đơn vị cm).',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'MN // BC nên ΔAMN ∽ ΔABC theo tỉ số AM/AB = 4/10 = 2/5, suy ra MN = 25 × 2/5 = 10 cm. Lỗi hay gặp là lấy MN = BC − AM hoặc dùng tỉ số AM/MB thay cho AM/AB.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định nghĩa hai tam giác đồng dạng ΔABC ∽ ΔDEF?',
        dap: 'Ba góc tương ứng bằng nhau và ba cạnh tương ứng tỉ lệ: AB/DE = BC/EF = CA/FD = k (tỉ số đồng dạng).',
      },
      {
        hoi: 'Ba trường hợp đồng dạng của tam giác?',
        dap: 'c.c.c (ba cạnh tỉ lệ), c.g.c (hai cạnh tỉ lệ và góc xen giữa bằng nhau), g.g (hai góc bằng nhau).',
      },
      {
        hoi: 'Tỉ số chu vi của hai tam giác đồng dạng bằng gì?',
        dap: 'Bằng tỉ số đồng dạng k.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c9-b2',
    grade: '8',
    chapterNumber: 9,
    chapterTitle: 'Tam giác đồng dạng',
    lessonNumber: 2,
    title: 'Định lí Pythagore và ứng dụng',
    hook:
      'Thợ nề muốn dựng một góc vuông ở sân mà không có ê-ke. Bác lấy sợi dây thắt nút chia thành 12 khoảng bằng nhau, giăng thành tam giác có ba cạnh 3, 4 và 5 khoảng. ' +
      'Góc giữa hai cạnh 3 và 4 chắc chắn là góc vuông. Vì sao bộ ba 3, 4, 5 lại có phép màu ấy? ' +
      'Đó là định lí Pythagore, công cụ tính độ dài quan trọng nhất của hình học.',
    theory:
      'ĐỊNH LÍ PYTHAGORE\n' +
      'Trong tam giác vuông, bình phương cạnh huyền bằng tổng các bình phương của hai cạnh góc vuông. Tam giác ABC vuông tại A thì BC² = AB² + AC².\n' +
      'Cạnh huyền là cạnh đối diện góc vuông và luôn là cạnh dài nhất.\n' +
      'Vì sao đúng? Lấy bốn tam giác vuông bằng nhau, cạnh góc vuông a và b, cạnh huyền c. Xếp chúng vào bốn góc của một hình vuông cạnh a + b; phần còn lại ở giữa là hình vuông cạnh c. Diện tích hình vuông lớn tính hai cách: (a + b)² = 4 × (ab/2) + c². Khai triển: a² + 2ab + b² = 2ab + c², suy ra a² + b² = c².\n\n' +
      'ĐỊNH LÍ PYTHAGORE ĐẢO\n' +
      'Nếu một tam giác có bình phương một cạnh bằng tổng các bình phương của hai cạnh còn lại thì tam giác đó là tam giác vuông, vuông tại đỉnh đối diện cạnh ấy.\n' +
      'Vì sao? Dựng tam giác DEF vuông tại D có DE = AB, DF = AC. Theo định lí thuận EF² = AB² + AC² = BC², nên EF = BC. Hai tam giác ABC và DEF có ba cạnh bằng nhau nên bằng nhau (c.c.c), suy ra ∠A = ∠D = 90°.\n\n' +
      'MỘT SỐ BỘ BA PYTHAGORE\n' +
      '3 – 4 – 5, 6 – 8 – 10, 5 – 12 – 13, 8 – 15 – 17. Nhân các số của một bộ ba với cùng một số dương thì được bộ ba mới.\n\n' +
      'ỨNG DỤNG\n' +
      '— Biết hai cạnh góc vuông, tính cạnh huyền: c = √(a² + b²).\n' +
      '— Biết cạnh huyền và một cạnh góc vuông, tính cạnh còn lại: a = √(c² − b²).\n' +
      '— Kiểm tra một tam giác có vuông không: bình phương cạnh dài nhất có bằng tổng bình phương hai cạnh kia không.\n' +
      '— Đo gián tiếp: thang dựa tường (độ cao chạm tường), đường chéo khung cửa hay màn hình, khoảng cách giữa hai điểm theo hai hướng vuông góc nhau.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng định lí cho tam giác không vuông.\n' +
      '— Nhầm cạnh huyền: tìm cạnh góc vuông mà vẫn cộng bình phương thay vì trừ.\n' +
      '— Quên khai căn, đáp c² thay vì c (ví dụ đáp 25 thay vì 5).\n' +
      '— Dùng định lí đảo mà lấy bình phương cạnh dài nhất cộng với bình phương một cạnh khác, thay vì so bình phương cạnh dài nhất với tổng bình phương hai cạnh còn lại.',
    workedExample: {
      problem:
        'a) Một chiếc thang dài 2,5 m dựa vào tường thẳng đứng, chân thang cách tường 0,7 m. Thang chạm tường ở độ cao bao nhiêu? b) Tam giác có ba cạnh 9 cm, 12 cm, 15 cm có phải tam giác vuông không?',
      steps: [
        'Thang, tường và mặt đất tạo thành tam giác vuông; thang là cạnh huyền (2,5 m), chân thang cách tường là cạnh góc vuông (0,7 m). Gọi h là độ cao cần tìm.',
        'Theo định lí Pythagore: h² + 0,7² = 2,5², suy ra h² = 6,25 − 0,49 = 5,76.',
        'h = √5,76 = 2,4 m (vì 2,4² = 5,76). Thang chạm tường ở độ cao 2,4 m.',
        'Câu b: cạnh dài nhất là 15 cm. Ta có 9² + 12² = 81 + 144 = 225 và 15² = 225.',
        'Bình phương cạnh dài nhất bằng tổng bình phương hai cạnh kia nên theo định lí đảo, tam giác là tam giác vuông (vuông ở đỉnh đối diện cạnh 15 cm).',
      ],
      answer: 'a) 2,4 m. b) Có, là tam giác vuông.',
    },
    checkQuestions: [
      {
        prompt: 'Tam giác ABC vuông tại A có AB = 6 cm, AC = 8 cm. Tính BC (đơn vị cm).',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'BC² = 6² + 8² = 36 + 64 = 100 nên BC = 10 cm. Lỗi hay gặp là dừng ở 100 mà quên khai căn, hoặc cộng thẳng 6 + 8 = 14.',
      },
      {
        prompt:
          'Một chiếc thang dài 13 m dựa vào tường thẳng đứng, đầu thang chạm tường ở độ cao 12 m. Tính khoảng cách từ chân thang đến chân tường (đơn vị mét).',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Thang là cạnh huyền nên khoảng cách cần tìm x thoả x² = 13² − 12² = 169 − 144 = 25, suy ra x = 5 m. Lỗi hay gặp là cộng 13² + 12² như khi tìm cạnh huyền, ra số lớn hơn thang.',
      },
      {
        prompt: 'Bộ ba độ dài nào (đơn vị cm) là ba cạnh của một tam giác vuông?',
        choices: [
          { id: 'a', label: '6, 8, 10' },
          { id: 'b', label: '7, 8, 9' },
          { id: 'c', label: '4, 5, 6' },
          { id: 'd', label: '5, 6, 8' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Chỉ bộ 6, 8, 10 có 6² + 8² = 100 = 10². Các bộ còn lại không thoả: chẳng hạn 7² + 8² = 113 khác 9² = 81. Lỗi hay gặp là so tổng hai cạnh nhỏ với cạnh lớn thay vì so bình phương.',
      },
      {
        prompt:
          'Một khung cửa hình chữ nhật cao 2 m và rộng 1,5 m. Người thợ gia cố bằng một thanh chéo nối hai góc đối diện. Thanh chéo dài bao nhiêu mét?',
        answer: { kind: 'numeric', value: 2.5 },
        explain:
          'Thanh chéo là cạnh huyền của tam giác vuông có hai cạnh góc vuông 2 m và 1,5 m: 2² + 1,5² = 4 + 2,25 = 6,25 nên thanh dài √6,25 = 2,5 m. Lỗi hay gặp là cộng 2 + 1,5 = 3,5 m (độ dài hai cạnh, không phải đường chéo).',
      },
    ],
    srsCards: [
      {
        hoi: 'Phát biểu định lí Pythagore.',
        dap: 'Tam giác ABC vuông tại A thì BC² = AB² + AC² (cạnh huyền BC là cạnh dài nhất, đối diện góc vuông).',
      },
      {
        hoi: 'Định lí Pythagore đảo dùng để làm gì?',
        dap: 'Nhận biết tam giác vuông: nếu bình phương cạnh dài nhất bằng tổng bình phương hai cạnh còn lại thì tam giác vuông.',
      },
      {
        hoi: 'Kể bốn bộ ba Pythagore thường gặp.',
        dap: '3 – 4 – 5, 6 – 8 – 10, 5 – 12 – 13, 8 – 15 – 17.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c9-b3',
    grade: '8',
    chapterNumber: 9,
    chapterTitle: 'Tam giác đồng dạng',
    lessonNumber: 3,
    title: 'Tam giác vuông đồng dạng và hình đồng dạng',
    hook:
      'Không cần trèo lên đo, bạn vẫn biết chiều cao cây phượng ở sân trường: cắm một cây cọc thẳng đứng, đo bóng của cọc và bóng của cây cùng một lúc. ' +
      'Tia nắng song song nên cọc và cây tạo ra hai tam giác vuông có hình dạng giống nhau, chỉ khác kích thước. ' +
      'Bài này học cách nhận biết nhanh hai tam giác vuông đồng dạng và mở rộng sang các hình đồng dạng nói chung.',
    theory:
      'TRƯỜNG HỢP ĐỒNG DẠNG CỦA TAM GIÁC VUÔNG\n' +
      'Hai tam giác vuông đã có sẵn một góc bằng nhau (góc vuông) nên các trường hợp đồng dạng gọn hơn:\n' +
      '— Có một góc nhọn bằng nhau thì đồng dạng (g.g).\n' +
      '— Có hai cạnh góc vuông tương ứng tỉ lệ thì đồng dạng (c.g.c, vì góc xen giữa là góc vuông).\n' +
      '— Cạnh huyền và một cạnh góc vuông của tam giác này tỉ lệ với cạnh huyền và một cạnh góc vuông của tam giác kia thì đồng dạng.\n' +
      'Vì sao trường hợp thứ ba đúng? Giả sử BC/EF = AB/DE = k. Theo Pythagore, AC² = BC² − AB² = k² × (EF² − DE²) = k² × DF², nên AC = k × DF. Vậy cả ba cạnh tỉ lệ và hai tam giác đồng dạng (c.c.c).\n\n' +
      'ĐO CHIỀU CAO BẰNG BÓNG NẮNG\n' +
      'Cùng một thời điểm, các tia nắng song song nên góc nắng chiếu xuống đất bằng nhau. Cọc thẳng đứng và cây thẳng đứng đều vuông góc với mặt đất, nên tam giác (cọc, bóng cọc, tia nắng) và tam giác (cây, bóng cây, tia nắng) là hai tam giác vuông có một góc nhọn bằng nhau, suy ra đồng dạng. Do đó chiều cao cây / chiều cao cọc = bóng cây / bóng cọc.\n\n' +
      'TỈ SỐ DIỆN TÍCH (CHỈ NÊU)\n' +
      'Nếu hai tam giác đồng dạng theo tỉ số k thì tỉ số diện tích bằng k². Hiểu nôm na: diện tích có hai chiều (đáy và chiều cao), cả hai đều nhân với k. Ví dụ k = 2 thì diện tích gấp 4 lần.\n\n' +
      'HÌNH ĐỒNG DẠNG\n' +
      'Hai hình đồng dạng nếu hình này là bản phóng to hoặc thu nhỏ của hình kia (cùng hình dạng, khác kích thước): bản đồ, ảnh chụp, mô hình. Hai hình tròn bất kỳ đồng dạng, hai hình vuông bất kỳ đồng dạng, còn hai hình chữ nhật bất kỳ thì chưa chắc.\n' +
      'Hình đồng dạng phối cảnh: lấy điểm O và một hình. Với mỗi điểm M của hình, lấy điểm N trên tia OM sao cho ON = k × OM. Các điểm N tạo thành một hình đồng dạng với hình ban đầu theo tỉ số k; điểm O gọi là tâm phối cảnh. Ví dụ: ánh sáng từ một bóng đèn nhỏ chiếu tấm bìa lên màn song song với tấm bìa thì bóng trên màn đồng dạng với tấm bìa.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm tỉ số diện tích bằng k (đúng là k²).\n' +
      '— Cho rằng hai hình chữ nhật hay hai hình thoi bất kỳ đều đồng dạng. Chúng chỉ đồng dạng khi các cạnh tương ứng tỉ lệ và các góc tương ứng bằng nhau.\n' +
      '— Đo bóng cọc và bóng cây ở hai thời điểm khác nhau, khi đó góc nắng khác nhau và tam giác không còn đồng dạng.',
    workedExample: {
      problem:
        'Cùng một lúc, cọc cao 1,2 m có bóng dài 1,8 m, còn cây phượng có bóng dài 9 m. a) Tính chiều cao cây. b) Diện tích tam giác (cây, bóng cây, tia nắng) gấp mấy lần diện tích tam giác (cọc, bóng cọc, tia nắng)?',
      steps: [
        'Các tia nắng song song nên góc nắng hai nơi bằng nhau; cọc và cây đều thẳng đứng. Hai tam giác vuông có một góc nhọn bằng nhau nên đồng dạng (g.g).',
        'Cây / cọc = bóng cây / bóng cọc, tức h/1,2 = 9/1,8. Suy ra h = 1,2 × 9 : 1,8 = 6 m.',
        'Tỉ số đồng dạng k = 9/1,8 = 5 (tam giác của cây lớn hơn gấp 5 lần).',
        'Tỉ số diện tích bằng k² = 25. Kiểm tra: diện tích tam giác của cây là 6 × 9 : 2 = 27 m², của cọc là 1,2 × 1,8 : 2 = 1,08 m², và 27 : 1,08 = 25.',
      ],
      answer: 'a) Cây cao 6 m. b) Gấp 25 lần.',
    },
    checkQuestions: [
      {
        prompt:
          'Cùng một lúc, cọc cao 2 m có bóng dài 3 m, cột cờ có bóng dài 12 m. Tính chiều cao cột cờ (đơn vị mét).',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'Hai tam giác vuông đồng dạng nên cột cờ / cọc = bóng cột cờ / bóng cọc = 12/3 = 4, suy ra cột cờ cao 2 × 4 = 8 m. Lỗi hay gặp là so chiều cao với bóng của cùng một vật (2/3) thay vì so hai chiều cao với hai bóng tương ứng.',
      },
      {
        prompt:
          'Mỗi cặp dưới đây gồm hai tam giác vuông: ΔABC vuông tại A và ΔDEF vuông tại D. Cặp nào đồng dạng?',
        choices: [
          { id: 'a', label: 'AB = 3 cm, AC = 4 cm; DE = 6 cm, DF = 8 cm' },
          { id: 'b', label: 'AB = 3 cm, AC = 4 cm; DE = 6 cm, DF = 9 cm' },
          { id: 'c', label: '∠B = 40°; ∠E = 45°' },
          { id: 'd', label: 'AB = 3 cm, BC = 5 cm; DE = 8 cm, EF = 10 cm' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Ở a, hai cạnh góc vuông tỉ lệ: 3/6 = 4/8 = 1/2 nên đồng dạng (c.g.c). Ở b, 3/6 = 1/2 nhưng 4/9 khác; ở c, góc nhọn 40° và 45° không bằng nhau; ở d, 3/8 khác 5/10. Lỗi hay gặp là chỉ kiểm một tỉ số.',
      },
      {
        prompt:
          'Hai tam giác đồng dạng với tỉ số đồng dạng 2/3 (tam giác nhỏ so với tam giác lớn). Diện tích tam giác lớn là 45 cm². Tính diện tích tam giác nhỏ (đơn vị cm²).',
        answer: { kind: 'numeric', value: 20 },
        explain:
          'Tỉ số diện tích bằng bình phương tỉ số đồng dạng, tức (2/3)² = 4/9, nên diện tích tam giác nhỏ là 45 × 4/9 = 20 cm². Lỗi hay gặp là nhân với 2/3 thay vì 4/9, ra 30 cm².',
      },
      {
        prompt:
          'Một đèn nhỏ đặt tại O chiếu qua tấm bìa hình vuông cạnh 10 cm lên một màn song song với tấm bìa. Tấm bìa cách đèn 20 cm, màn cách đèn 60 cm. Tính cạnh của hình vuông bóng trên màn (đơn vị cm).',
        answer: { kind: 'numeric', value: 30 },
        explain:
          'Bóng và tấm bìa là hai hình đồng dạng phối cảnh với tâm O, tỉ số k = 60 : 20 = 3, nên cạnh bóng là 10 × 3 = 30 cm. Lỗi hay gặp là lấy k = 40 : 20 = 2 (dùng khoảng cách từ bìa đến màn thay vì từ đèn đến màn).',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai tam giác vuông đồng dạng khi nào?',
        dap: 'Có một góc nhọn bằng nhau; hoặc hai cạnh góc vuông tỉ lệ; hoặc cạnh huyền và một cạnh góc vuông tỉ lệ.',
      },
      {
        hoi: 'Tỉ số diện tích của hai tam giác đồng dạng theo tỉ số k?',
        dap: 'Bằng k² (diện tích tam giác nhân với bình phương tỉ số đồng dạng).',
      },
      {
        hoi: 'Hai hình nào luôn đồng dạng với nhau?',
        dap: 'Hai hình vuông bất kỳ, hai hình tròn bất kỳ (hai hình chữ nhật bất kỳ thì chưa chắc).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
