// lessons/toan8c2.ts — Toán 8, Chương 2: Hằng đẳng thức đáng nhớ và ứng dụng.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C2_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c2-b1',
    grade: '8',
    chapterNumber: 2,
    chapterTitle: 'Hằng đẳng thức đáng nhớ và ứng dụng',
    lessonNumber: 1,
    title: 'Hiệu hai bình phương và bình phương của một tổng, một hiệu',
    hook:
      'Minh tính nhẩm 51² chỉ trong một giây: 50² là 2500, thêm 2 · 50 · 1 = 100, thêm 1², được 2601. ' +
      'Tương tự, 49 · 51 = 50² − 1² = 2499. Cậu không hề bấm máy tính, chỉ dùng ba "công thức đặc biệt" mà người ta gọi là hằng đẳng thức đáng nhớ. ' +
      'Bài này giúp em hiểu vì sao các công thức đó đúng và dùng chúng để tính nhanh, khai triển và rút gọn.',
    theory:
      'BA HẰNG ĐẲNG THỨC ĐẦU TIÊN\n' +
      'Với A và B là các biểu thức bất kì:\n' +
      '— Bình phương của một tổng: (A + B)² = A² + 2AB + B².\n' +
      '— Bình phương của một hiệu: (A − B)² = A² − 2AB + B².\n' +
      '— Hiệu hai bình phương: A² − B² = (A − B)(A + B).\n' +
      'Hằng đẳng thức là đẳng thức đúng với mọi giá trị của các biến (khác với phương trình, chỉ đúng với vài giá trị).\n\n' +
      'VÌ SAO ĐÚNG?\n' +
      'Hình vuông cạnh (a + b) được chia thành hình vuông cạnh a (diện tích a²), hình vuông cạnh b (diện tích b²) và hai hình chữ nhật a × b. ' +
      'Cộng lại: (a + b)² = a² + ab + ab + b² = a² + 2ab + b². Hai hạng tử ab chính là "hạng tử ở giữa" mà người học hay quên.\n' +
      'Còn (A − B)(A + B) = A² + AB − AB − B² = A² − B²: hai tích chéo +AB và −AB triệt tiêu nhau.\n\n' +
      'CÁCH DÙNG\n' +
      '— Khai triển: (2x − 3y)² = (2x)² − 2 · 2x · 3y + (3y)² = 4x² − 12xy + 9y².\n' +
      '— Tính nhẩm: 98² = (100 − 2)² = 10 000 − 400 + 4 = 9604; 53 · 47 = (50 + 3)(50 − 3) = 2500 − 9 = 2491.\n' +
      '— Nhận dạng ngược: x² + 10x + 25 = (x + 5)², vì 25 = 5² và 10x = 2 · x · 5.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết (A + B)² = A² + B² (thiếu hạng tử 2AB). Ví dụ (3 + 4)² = 49, còn 3² + 4² = 25.\n' +
      '— Viết (A − B)² = A² − B²; nhầm giữa bình phương một hiệu và hiệu hai bình phương.\n' +
      '— Quên bình phương hệ số: (2x)² = 4x² (không phải 2x²).\n' +
      '— Quên dấu: hạng tử cuối của (A − B)² luôn là +B², không phải −B².',
    workedExample: {
      problem: 'a) Khai triển (2x − 3y)². b) Tính nhanh 98². c) Tính nhanh 53² − 47².',
      steps: [
        'a) Áp dụng (A − B)² = A² − 2AB + B² với A = 2x, B = 3y: (2x)² − 2 · 2x · 3y + (3y)².',
        'a) Tính từng hạng tử: 4x² − 12xy + 9y².',
        'b) Viết 98 = 100 − 2 rồi dùng (A − B)²: (100 − 2)² = 100² − 2 · 100 · 2 + 2² = 10 000 − 400 + 4 = 9604.',
        'c) Dùng A² − B² = (A − B)(A + B) với A = 53, B = 47: 53² − 47² = (53 − 47)(53 + 47).',
        'c) Tính: 6 · 100 = 600.',
      ],
      answer: 'a) 4x² − 12xy + 9y². b) 9604. c) 600.',
    },
    checkQuestions: [
      {
        prompt: 'Tính nhẩm 99² bằng hằng đẳng thức (99 = 100 − 1). Kết quả bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 9801 },
        explain:
          '99² = (100 − 1)² = 100² − 2 · 100 · 1 + 1² = 10 000 − 200 + 1 = 9801. ' +
          'Lỗi hay gặp là bỏ hạng tử ở giữa và đáp 10 000 − 1 = 9999, tức nhầm với hiệu hai bình phương.',
      },
      {
        prompt: 'Đa thức x² − 6x + 9 bằng biểu thức nào sau đây?',
        choices: [
          { id: 'a', label: '(x − 3)²' },
          { id: 'b', label: '(x + 3)²' },
          { id: 'c', label: '(x − 3)(x + 3)' },
          { id: 'd', label: '(x − 9)²' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Ta có 9 = 3² và 6x = 2 · x · 3, dấu ở giữa là trừ nên x² − 6x + 9 = (x − 3)². ' +
          'Đáp án b sai dấu hạng tử giữa; đáp án c khai triển ra x² − 9 (hiệu hai bình phương); đáp án d bình phương nhầm 9 thay vì 3.',
      },
      {
        prompt:
          'Khai triển (3x − 2y)². Hệ số của xy trong kết quả bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -12 },
        explain:
          '(3x − 2y)² = 9x² − 2 · 3x · 2y + 4y² = 9x² − 12xy + 4y², nên hệ số của xy là −12. ' +
          'Lỗi hay gặp là tính hạng tử giữa thành −6xy (quên nhân đôi) hoặc +12xy (sai dấu).',
      },
      {
        prompt:
          'Một mảnh đất hình vuông cạnh 20 m. Người ta tăng chiều dài thêm 3 m và giảm chiều rộng đi 3 m. ' +
          'Diện tích mảnh đất mới là bao nhiêu mét vuông?',
        answer: { kind: 'numeric', value: 391 },
        explain:
          'Diện tích mới = (20 + 3)(20 − 3) = 20² − 3² = 400 − 9 = 391 (m²). ' +
          'Lỗi hay gặp là nghĩ rằng "thêm 3 bớt 3 thì không đổi" và đáp 400; thực ra diện tích giảm đi 3² = 9 m².',
      },
    ],
    srsCards: [
      {
        hoi: 'Viết công thức (A + B)² và (A − B)².',
        dap: '(A + B)² = A² + 2AB + B²; (A − B)² = A² − 2AB + B². Đừng quên hạng tử ở giữa 2AB.',
      },
      {
        hoi: 'Viết công thức hiệu hai bình phương.',
        dap: 'A² − B² = (A − B)(A + B).',
      },
      {
        hoi: 'Vì sao (A + B)² khác A² + B²?',
        dap: 'Vì khai triển còn có hai tích chéo AB + AB = 2AB. Ví dụ (3 + 4)² = 49 còn 3² + 4² = 25.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c2-b2',
    grade: '8',
    chapterNumber: 2,
    chapterTitle: 'Hằng đẳng thức đáng nhớ và ứng dụng',
    lessonNumber: 2,
    title: 'Lập phương của một tổng, một hiệu và tổng, hiệu hai lập phương',
    hook:
      'Một chiếc hộp quà hình lập phương có cạnh x (cm). Nhà sản xuất đổi sang loại hộp lớn hơn, cạnh x + 1 (cm). ' +
      'Thể tích tăng thêm là (x + 1)³ − x³. Muốn biết con số đó nhanh gọn, ta cần công thức lập phương của một tổng. ' +
      'Bài này thêm bốn hằng đẳng thức bậc ba vào "hộp công cụ": hai công thức lập phương, tổng và hiệu hai lập phương.',
    theory:
      'LẬP PHƯƠNG CỦA MỘT TỔNG, MỘT HIỆU\n' +
      '(A + B)³ = A³ + 3A²B + 3AB² + B³.\n' +
      '(A − B)³ = A³ − 3A²B + 3AB² − B³.\n' +
      'VÌ SAO đúng? (A + B)³ = (A + B)² · (A + B) = (A² + 2AB + B²)(A + B). Nhân ra và gộp được A³ + 3A²B + 3AB² + B³. ' +
      'Các hệ số 1, 3, 3, 1 đối xứng; số mũ của A giảm dần còn số mũ của B tăng dần. Với (A − B)³, dấu xen kẽ + − + −.\n\n' +
      'TỔNG VÀ HIỆU HAI LẬP PHƯƠNG\n' +
      'A³ + B³ = (A + B)(A² − AB + B²).\n' +
      'A³ − B³ = (A − B)(A² + AB + B²).\n' +
      'Thừa số thứ hai trông giống bình phương của một tổng hoặc một hiệu nhưng thiếu hệ số 2 ở hạng tử giữa, nên em đừng nhầm với (A ± B)².\n' +
      'Kiểm tra: (A + B)(A² − AB + B²) = A³ − A²B + AB² + A²B − AB² + B³ = A³ + B³ (các hạng tử giữa triệt tiêu).\n\n' +
      'CÁCH DÙNG\n' +
      '— Khai triển: (x + 2)³ = x³ + 3 · x² · 2 + 3 · x · 2² + 2³ = x³ + 6x² + 12x + 8.\n' +
      '— Tính nhẩm: 19³ = (20 − 1)³ = 8000 − 1200 + 60 − 1 = 6859.\n' +
      '— Nhận dạng: 27x³ − 8 = (3x)³ − 2³ = (3x − 2)(9x² + 6x + 4).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết (A + B)³ = A³ + B³ (thiếu hai hạng tử ở giữa 3A²B và 3AB²).\n' +
      '— Sai dấu trong (A − B)³: các dấu phải xen kẽ, hạng tử cuối là −B³.\n' +
      '— Quên nhân hệ số 3 hoặc quên bình phương/lập phương hệ số: (2x)³ = 8x³ (không phải 2x³).\n' +
      '— Nhầm dấu ở thừa số thứ hai: A³ + B³ đi với A² − AB + B², còn A³ − B³ đi với A² + AB + B².',
    workedExample: {
      problem: 'a) Khai triển (x + 2)³. b) Tính nhanh 99³. c) Viết 27x³ − 8 dưới dạng tích.',
      steps: [
        'a) Áp dụng (A + B)³ với A = x, B = 2: x³ + 3 · x² · 2 + 3 · x · 2² + 2³.',
        'a) Tính từng hạng tử: x³ + 6x² + 12x + 8.',
        'b) Viết 99 = 100 − 1: (100 − 1)³ = 100³ − 3 · 100² · 1 + 3 · 100 · 1² − 1³.',
        'b) Tính: 1 000 000 − 30 000 + 300 − 1 = 970 299.',
        'c) Nhận ra 27x³ = (3x)³ và 8 = 2³, vậy dùng A³ − B³ với A = 3x, B = 2.',
        'c) 27x³ − 8 = (3x − 2)((3x)² + 3x · 2 + 2²) = (3x − 2)(9x² + 6x + 4).',
      ],
      answer: 'a) x³ + 6x² + 12x + 8. b) 970 299. c) (3x − 2)(9x² + 6x + 4).',
    },
    checkQuestions: [
      {
        prompt:
          'Khai triển (x − 3)³. Hệ số của x² trong kết quả bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -9 },
        explain:
          '(x − 3)³ = x³ − 3 · x² · 3 + 3 · x · 3² − 3³ = x³ − 9x² + 27x − 27, nên hệ số của x² là −9. ' +
          'Lỗi hay gặp là quên hệ số 3 và đáp −3, hoặc đổi dấu sai thành +9.',
      },
      {
        prompt: 'Tính nhẩm 19³ bằng cách viết 19 = 20 − 1. Kết quả bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 6859 },
        explain:
          '19³ = (20 − 1)³ = 20³ − 3 · 20² · 1 + 3 · 20 · 1² − 1³ = 8000 − 1200 + 60 − 1 = 6859. ' +
          'Lỗi hay gặp là viết 20³ − 1³ = 7999, tức bỏ hai hạng tử giữa của hằng đẳng thức.',
      },
      {
        prompt: 'Phân tích đa thức 8x³ + 27 thành tích, ta được:',
        choices: [
          { id: 'a', label: '(2x + 3)(4x² − 6x + 9)' },
          { id: 'b', label: '(2x + 3)(4x² + 6x + 9)' },
          { id: 'c', label: '(2x + 3)³' },
          { id: 'd', label: '(2x − 3)(4x² + 6x + 9)' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          '8x³ + 27 = (2x)³ + 3³ = (2x + 3)((2x)² − 2x · 3 + 3²) = (2x + 3)(4x² − 6x + 9). ' +
          'Tổng hai lập phương đi với thừa số thứ hai có dấu TRỪ ở giữa; b là công thức của hiệu, c là lập phương một tổng, d dành cho 8x³ − 27.',
      },
      {
        prompt:
          'Hộp quà hình lập phương cạnh x (cm) được đổi sang hộp cạnh x + 1 (cm). Thể tích tăng thêm là (x + 1)³ − x³ = 3x² + 3x + 1 (cm³). ' +
          'Tính thể tích tăng thêm khi x = 10.',
        answer: { kind: 'numeric', value: 331 },
        explain:
          'Thay x = 10: 3 · 100 + 3 · 10 + 1 = 300 + 30 + 1 = 331 (cm³). Kiểm tra: 11³ − 10³ = 1331 − 1000 = 331. ' +
          'Lỗi hay gặp là tính 3x² thành (3x)² = 900 hoặc quên hạng tử +1.',
      },
    ],
    srsCards: [
      {
        hoi: 'Viết công thức (A + B)³ và (A − B)³.',
        dap: '(A + B)³ = A³ + 3A²B + 3AB² + B³; (A − B)³ = A³ − 3A²B + 3AB² − B³ (dấu xen kẽ).',
      },
      {
        hoi: 'Viết công thức tổng hai lập phương.',
        dap: 'A³ + B³ = (A + B)(A² − AB + B²).',
      },
      {
        hoi: 'Viết công thức hiệu hai lập phương.',
        dap: 'A³ − B³ = (A − B)(A² + AB + B²).',
      },
      {
        hoi: 'Mẹo nhớ dấu ở A³ ± B³ = (A ± B)(...)?',
        dap: 'Dấu thứ nhất giữ nguyên như đề; trong ngoặc thứ hai, dấu ở giữa đối với dấu thứ nhất, hạng tử cuối luôn dương: A² ∓ AB + B².',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c2-b3',
    grade: '8',
    chapterNumber: 2,
    chapterTitle: 'Hằng đẳng thức đáng nhớ và ứng dụng',
    lessonNumber: 3,
    title: 'Phân tích đa thức thành nhân tử',
    hook:
      'Một tấm bìa hình chữ nhật có diện tích 3x² + 6x (cm²) và chiều rộng 3x (cm). Muốn biết chiều dài, em cần viết 3x² + 6x thành một tích có thừa số 3x: ' +
      '3x² + 6x = 3x(x + 2), nên chiều dài là x + 2 (cm). Việc viết một đa thức thành tích của các đa thức như vậy gọi là phân tích đa thức thành nhân tử, ' +
      'và nó là "phép nhân ngược" của khai triển.',
    theory:
      'PHÂN TÍCH ĐA THỨC THÀNH NHÂN TỬ LÀ GÌ?\n' +
      'Là biến đổi một đa thức thành tích của hai hay nhiều đa thức (gọi là các nhân tử). Đây là phép làm ngược lại với nhân đa thức. ' +
      'Kiểm tra kết quả bằng cách nhân lại các nhân tử: phải ra đúng đa thức ban đầu.\n\n' +
      'BA CÁCH THƯỜNG DÙNG\n' +
      '1) Đặt nhân tử chung. Tìm ƯCLN của các hệ số và các biến có mặt trong MỌI hạng tử (lấy số mũ nhỏ nhất), rồi đặt ra ngoài ngoặc. ' +
      'Ví dụ 6x²y − 9xy² = 3xy(2x − 3y).\n' +
      '2) Dùng hằng đẳng thức. Nhận ra dạng A² ± 2AB + B², A² − B², A³ ± B³, (A ± B)³. Ví dụ 4x² − 12x + 9 = (2x − 3)².\n' +
      '3) Nhóm hạng tử. Ghép các hạng tử thành nhóm sao cho mỗi nhóm có nhân tử chung, rồi đặt nhân tử chung của cả các nhóm. ' +
      'Ví dụ xy + 2x − 3y − 6 = x(y + 2) − 3(y + 2) = (y + 2)(x − 3).\n' +
      'Nhiều bài cần phối hợp: 3x³ − 12x = 3x(x² − 4) = 3x(x − 2)(x + 2). Cứ đặt nhân tử chung trước, rồi mới nhìn xem còn hằng đẳng thức nào không.\n\n' +
      'VÌ SAO PHẢI PHÂN TÍCH?\n' +
      'Khi đa thức đã thành tích thì dễ rút gọn phân thức, dễ giải phương trình dạng "tích bằng 0" và dễ tính nhanh. ' +
      'Ví dụ 85 · 12,7 + 15 · 12,7 = (85 + 15) · 12,7 = 100 · 12,7 = 1270.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đặt nhân tử chung mà mất hạng tử: x² − x = x(x − 1) chứ không phải x(x); sau khi đặt ra ngoài, hạng tử trùng nhân tử còn lại số 1.\n' +
      '— Sai dấu khi đặt dấu trừ ra ngoài: −a − b = −(a + b), còn −a + b = −(a − b).\n' +
      '— Dừng quá sớm: x⁴ − 16 = (x² − 4)(x² + 4) chưa xong vì x² − 4 còn phân tích được thành (x − 2)(x + 2).\n' +
      '— Nhóm hạng tử khi nhóm sau không còn nhân tử chung giống nhóm trước (phải thử đổi cách nhóm).',
    workedExample: {
      problem:
        'Phân tích thành nhân tử: a) 6x²y − 9xy². b) x² − 2xy + y² − 9. c) x³ − 3x² + x − 3.',
      steps: [
        'a) ƯCLN của 6 và 9 là 3; biến chung nhỏ nhất là x và y. Đặt 3xy ra ngoài: 6x²y − 9xy² = 3xy(2x − 3y).',
        'b) Ba hạng tử đầu tạo thành bình phương một hiệu: x² − 2xy + y² = (x − y)².',
        'b) Đa thức trở thành (x − y)² − 3², là hiệu hai bình phương với A = x − y, B = 3.',
        'b) Vậy x² − 2xy + y² − 9 = (x − y − 3)(x − y + 3).',
        'c) Nhóm hai hạng tử đầu và hai hạng tử sau: (x³ − 3x²) + (x − 3).',
        'c) Đặt nhân tử chung trong từng nhóm: x²(x − 3) + 1 · (x − 3).',
        'c) Nhân tử chung của hai nhóm là (x − 3): x³ − 3x² + x − 3 = (x − 3)(x² + 1).',
      ],
      answer: 'a) 3xy(2x − 3y). b) (x − y − 3)(x − y + 3). c) (x − 3)(x² + 1).',
    },
    checkQuestions: [
      {
        prompt: 'Biết 5x² − 10x = 5x(x − a). Tìm số a.',
        answer: { kind: 'numeric', value: 2 },
        explain:
          '5x² − 10x có nhân tử chung 5x: 5x · x − 5x · 2 = 5x(x − 2), vậy a = 2. ' +
          'Lỗi hay gặp là chia 10x cho 5x được 2x chứ không phải 2; sau khi đặt 5x ra ngoài ta phải chia từng hạng tử cho 5x.',
      },
      {
        prompt: 'Phân tích đa thức xy − 3x + 2y − 6 thành nhân tử, ta được:',
        choices: [
          { id: 'a', label: '(x + 2)(y − 3)' },
          { id: 'b', label: '(x − 2)(y + 3)' },
          { id: 'c', label: '(x + 3)(y − 2)' },
          { id: 'd', label: '(x − 3)(y + 2)' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Nhóm (xy − 3x) + (2y − 6) = x(y − 3) + 2(y − 3) = (y − 3)(x + 2). Nhân lại để kiểm tra: (x + 2)(y − 3) = xy − 3x + 2y − 6. ' +
          'Các đáp án còn lại đều cho ít nhất một hạng tử sai dấu khi nhân lại.',
      },
      {
        prompt:
          'Tính nhanh bằng cách đặt nhân tử chung: 85 · 12,7 + 15 · 12,7. Kết quả bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 1270 },
        explain:
          '85 · 12,7 + 15 · 12,7 = (85 + 15) · 12,7 = 100 · 12,7 = 1270. ' +
          'Lỗi hay gặp là nhân từng tích rồi cộng, vừa mất thời gian vừa dễ sai dấu phẩy; nên nhìn ra nhân tử chung 12,7 trước.',
      },
      {
        prompt:
          'Tấm bìa hình chữ nhật có diện tích 3x² + 6x (cm²) và chiều rộng 3x (cm). Chiều dài là bao nhiêu cm khi x = 8?',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'Phân tích 3x² + 6x = 3x(x + 2), nên chiều dài là x + 2. Với x = 8 được 10 (cm). Kiểm tra: diện tích 3 · 64 + 48 = 240 và 24 · 10 = 240. ' +
          'Lỗi hay gặp là chia 3x² cho 3x được x rồi quên chia 6x, hoặc đáp x = 8.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân tích đa thức thành nhân tử là gì?',
        dap: 'Là viết đa thức đó thành tích của hai hay nhiều đa thức. Kiểm tra bằng cách nhân lại.',
      },
      {
        hoi: 'Ba cách phân tích đa thức thành nhân tử thường dùng?',
        dap: 'Đặt nhân tử chung; dùng hằng đẳng thức; nhóm hạng tử. Thường phối hợp, và đặt nhân tử chung trước.',
      },
      {
        hoi: 'Làm sao tìm nhân tử chung của một đa thức?',
        dap: 'Lấy ƯCLN của các hệ số, cùng mỗi biến có trong mọi hạng tử với số mũ nhỏ nhất.',
      },
      {
        hoi: 'Khi nào biết đã phân tích xong?',
        dap: 'Khi mọi nhân tử không còn phân tích được tiếp (ví dụ x² − 4 còn phân tích thành (x − 2)(x + 2) nên chưa xong).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
