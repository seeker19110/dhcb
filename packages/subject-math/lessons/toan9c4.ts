// lessons/toan9c4.ts — Toán 9, Chương 4: Hệ thức lượng trong tam giác vuông.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C4_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c4-b1',
    grade: '9',
    chapterNumber: 4,
    chapterTitle: 'Hệ thức lượng trong tam giác vuông',
    lessonNumber: 1,
    title: 'Tỉ số lượng giác của góc nhọn',
    hook:
      'Bác thợ xây dựng một chiếc thang dài 5 m tựa vào tường. Thang dựng quá thẳng thì dễ đổ về phía sau, dựng quá nghiêng thì dễ trượt chân. ' +
      'Người ta thường đo độ nghiêng của thang bằng góc tạo với mặt đất. Bài này dạy em các tỉ số lượng giác: những con số gắn với một góc nhọn, giúp tính cạnh từ góc và tính góc từ cạnh.',
    theory:
      'TỈ SỐ LƯỢNG GIÁC CỦA GÓC NHỌN\n' +
      'Cho tam giác ABC vuông tại A. Xét góc nhọn B: cạnh AC đối diện với B gọi là cạnh đối, cạnh AB nằm cạnh B gọi là cạnh kề, cạnh BC là cạnh huyền. Ta định nghĩa:\n' +
      '— sin B = cạnh đối / cạnh huyền = AC/BC.\n' +
      '— cos B = cạnh kề / cạnh huyền = AB/BC.\n' +
      '— tan B = cạnh đối / cạnh kề = AC/AB.\n' +
      '— cot B = cạnh kề / cạnh đối = AB/AC.\n' +
      'VÌ SAO các tỉ số này chỉ phụ thuộc vào góc, không phụ thuộc kích thước tam giác? Hai tam giác vuông có cùng một góc nhọn thì đồng dạng (góc − góc), nên tỉ số của hai cạnh tương ứng bằng nhau. ' +
      'Vì vậy ta viết sin α, cos α, tan α, cot α cho góc nhọn α bất kỳ.\n\n' +
      'NHẬN XÉT\n' +
      'Với góc nhọn α: 0 < sin α < 1 và 0 < cos α < 1 (cạnh góc vuông luôn nhỏ hơn cạnh huyền); tan α và cot α luôn dương và có thể lớn hơn 1.\n' +
      'Ngoài ra tan α = sin α / cos α; cot α = cos α / sin α; tan α · cot α = 1; sin²α + cos²α = 1 (chia hai vế của AB² + AC² = BC² cho BC²).\n\n' +
      'HAI GÓC PHỤ NHAU\n' +
      'Nếu α + β = 90° thì sin α = cos β; cos α = sin β; tan α = cot β; cot α = tan β.\n' +
      'VÌ SAO? Trong tam giác ABC vuông tại A thì B + C = 90°, và cạnh đối của góc B lại là cạnh kề của góc C. Ví dụ sin 35° = cos 55°.\n\n' +
      'TỈ SỐ LƯỢNG GIÁC CỦA CÁC GÓC ĐẶC BIỆT\n' +
      '— 30°: sin = 1/2; cos = √3/2; tan = √3/3; cot = √3.\n' +
      '— 45°: sin = √2/2; cos = √2/2; tan = 1; cot = 1.\n' +
      '— 60°: sin = √3/2; cos = 1/2; tan = √3; cot = √3/3.\n' +
      'Hai dòng 30° và 60° đổi chỗ cho nhau vì hai góc này phụ nhau.\n\n' +
      'DÙNG MÁY TÍNH CẦM TAY\n' +
      'Đặt máy ở chế độ độ (DEG) rồi bấm sin, cos, tan: ví dụ sin 25° ≈ 0,4226. Biết tỉ số, tìm góc bằng phím sin⁻¹, cos⁻¹, tan⁻¹ (bấm SHIFT rồi sin, cos, tan): ví dụ tan α = 0,75 thì α ≈ 36,87°.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm cạnh đối và cạnh kề: các cạnh này tính theo góc đang xét. Với góc B thì AC là cạnh đối, còn với góc C thì AC lại là cạnh kề.\n' +
      '— Nhầm sin với cos của 30° và 60° (sin 30° = 1/2, nhưng sin 60° = √3/2).\n' +
      '— Máy tính đang ở chế độ radian nên ra kết quả sai.\n' +
      '— Cho rằng tan α luôn nhỏ hơn 1; thực ra tan 60° = √3 ≈ 1,73.',
    workedExample: {
      problem:
        'Cho tam giác ABC vuông tại A có AB = 6 cm, AC = 8 cm. a) Tính BC. b) Tính sin B, cos B, tan B, cot B. c) So sánh sin B với cos C.',
      steps: [
        'a) Theo định lí Pythagore: BC² = AB² + AC² = 36 + 64 = 100, nên BC = 10 cm.',
        'b) Với góc B: cạnh đối là AC = 8, cạnh kề là AB = 6, cạnh huyền BC = 10.',
        'b) sin B = 8/10 = 4/5; cos B = 6/10 = 3/5.',
        'b) tan B = 8/6 = 4/3; cot B = 6/8 = 3/4 (hai số này nghịch đảo nhau).',
        'c) Với góc C: cạnh kề là AC = 8, cạnh huyền BC = 10, nên cos C = 8/10 = 4/5.',
        'c) Vậy sin B = cos C = 4/5, đúng với tính chất hai góc phụ nhau (B + C = 90°).',
      ],
      answer:
        'a) BC = 10 cm. b) sin B = 4/5; cos B = 3/5; tan B = 4/3; cot B = 3/4. c) sin B = cos C.',
    },
    checkQuestions: [
      {
        prompt:
          'Tam giác ABC vuông tại A có AB = 5 cm, AC = 12 cm, BC = 13 cm. Tính tan B (viết phân số).',
        answer: { kind: 'fraction', num: 12, den: 5 },
        explain:
          'Với góc B, cạnh đối là AC = 12 và cạnh kề là AB = 5 nên tan B = AC/AB = 12/5. ' +
          'Lỗi hay gặp là lấy AB/AC = 5/12 (đó là cot B) hoặc chia cho cạnh huyền 13 (đó là sin B hoặc cos B).',
      },
      {
        prompt:
          'Tính giá trị của biểu thức sin 30° + cos 60° + tan 45°. Nhập kết quả dưới dạng số.',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Tra bảng góc đặc biệt: sin 30° = 1/2, cos 60° = 1/2 và tan 45° = 1. Tổng là 1/2 + 1/2 + 1 = 2. ' +
          'Lỗi hay gặp là nhầm sin 30° với cos 30° = √3/2, khi đó kết quả không còn là số gọn.',
      },
      {
        prompt: 'Biết sin 35° ≈ 0,574. Giá trị nào dưới đây xấp xỉ cos 55°?',
        choices: [
          { id: 'a', label: '0,426' },
          { id: 'b', label: '0,574' },
          { id: 'c', label: '0,819' },
          { id: 'd', label: '1,574' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Hai góc 35° và 55° phụ nhau (35° + 55° = 90°) nên cos 55° = sin 35° ≈ 0,574. ' +
          'Đáp án a là 1 − 0,574, một phép trừ không có trong hệ thức nào; c là cos 35°, tức là lấy nhầm góc; d lớn hơn 1 nên không thể là cos của góc nhọn.',
      },
      {
        prompt:
          'Một chiếc thang dài 5 m dựa vào tường thẳng đứng, chân thang cách tường 3 m. Gọi α là góc giữa thang và mặt đất. ' +
          'Tính sin α (nhập số thập phân).',
        answer: { kind: 'numeric', value: 0.8 },
        explain:
          'Chiều cao đầu thang chạm tường là √(5² − 3²) = √16 = 4 (m). Cạnh đối của góc α là 4 m, cạnh huyền là 5 m nên sin α = 4/5 = 0,8. ' +
          'Lỗi hay gặp là lấy 3/5 = 0,6: đó là cos α, vì 3 m là cạnh kề của góc α.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định nghĩa sin, cos, tan, cot của góc nhọn trong tam giác vuông?',
        dap: 'sin = đối/huyền; cos = kề/huyền; tan = đối/kề; cot = kề/đối.',
      },
      {
        hoi: 'Hai góc phụ nhau thì tỉ số lượng giác liên hệ thế nào?',
        dap: 'Nếu α + β = 90° thì sin α = cos β và tan α = cot β. Ví dụ sin 35° = cos 55°.',
      },
      {
        hoi: 'Bảng tỉ số lượng giác của 30°, 45°, 60°?',
        dap: 'sin: 1/2; √2/2; √3/2. cos: √3/2; √2/2; 1/2. tan: √3/3; 1; √3. cot: √3; 1; √3/3.',
      },
      {
        hoi: 'Các hệ thức nào liên hệ sin, cos, tan, cot của cùng một góc?',
        dap: 'tan α = sin α / cos α; tan α · cot α = 1; sin²α + cos²α = 1.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c4-b2',
    grade: '9',
    chapterNumber: 4,
    chapterTitle: 'Hệ thức lượng trong tam giác vuông',
    lessonNumber: 2,
    title: 'Hệ thức giữa cạnh và góc trong tam giác vuông',
    hook:
      'Muốn biết cây cột cờ trước sân trường cao bao nhiêu mà không thể trèo lên đo, em có thể đứng cách chân cột một đoạn đã biết, đo góc nhìn lên đỉnh cột rồi tính. ' +
      'Các kỹ sư cũng đo chiều cao tòa nhà hay chiều rộng con sông theo cách tương tự. Bài này dạy các hệ thức giữa cạnh và góc trong tam giác vuông, nền tảng của phép đo gián tiếp đó.',
    theory:
      'HỆ THỨC GIỮA CẠNH VÀ GÓC\n' +
      'Cho tam giác ABC vuông tại A, đặt BC = a, AC = b, AB = c. Từ định nghĩa các tỉ số lượng giác ta có:\n' +
      '— b = a · sin B = a · cos C; c = a · sin C = a · cos B.\n' +
      '— b = c · tan B = c · cot C; c = b · tan C = b · cot B.\n' +
      'Cách nhớ: cạnh góc vuông bằng cạnh huyền nhân sin góc đối (hoặc nhân cos góc kề); cạnh góc vuông bằng cạnh góc vuông kia nhân tan góc đối (hoặc nhân cot góc kề).\n' +
      'VÌ SAO? Từ sin B = AC/BC suy ra AC = BC · sin B; từ tan B = AC/AB suy ra AC = AB · tan B. Các hệ thức còn lại chứng minh tương tự, chỉ là chuyển vế.\n\n' +
      'GIẢI TAM GIÁC VUÔNG\n' +
      'Giải tam giác vuông là tìm tất cả các cạnh và góc chưa biết khi đã biết hai yếu tố (ít nhất một cạnh). Các công cụ:\n' +
      '— Hai góc nhọn phụ nhau: B + C = 90°.\n' +
      '— Định lí Pythagore: a² = b² + c².\n' +
      '— Các hệ thức giữa cạnh và góc ở trên; biết hai cạnh thì tìm góc bằng tỉ số lượng giác rồi bấm phím sin⁻¹, cos⁻¹, tan⁻¹ của máy tính.\n' +
      'Quy ước làm tròn: độ dài thường đến hàng phần mười hoặc phần trăm, số đo góc đến độ (hoặc phút), theo yêu cầu của đề.\n\n' +
      'ỨNG DỤNG ĐO CHIỀU CAO VÀ KHOẢNG CÁCH\n' +
      'Góc nâng là góc giữa tia nhìn lên và phương nằm ngang. Đứng cách chân vật một khoảng d và nhìn lên đỉnh dưới góc nâng α thì phần vật cao hơn mắt là d · tan α. ' +
      'Chiều cao vật = d · tan α + chiều cao từ mặt đất tới mắt người đo.\n' +
      'Ví dụ: đứng cách tháp 50 m, góc nâng 30°: phần cao hơn mắt là 50 · tan 30° = 50 · √3/3 ≈ 28,87 m.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Chọn sai tỉ số: dùng sin với cạnh KỀ hoặc cos với cạnh ĐỐI. Hãy vẽ hình và xác định cạnh đối, cạnh kề theo đúng góc đang xét.\n' +
      '— Quên cộng chiều cao của mắt (hoặc của giác kế) khi tính chiều cao vật.\n' +
      '— Làm tròn sớm: làm tròn tan 35° ≈ 0,7 rồi nhân sẽ lệch nhiều. Hãy tính cả biểu thức rồi mới làm tròn kết quả cuối.\n' +
      '— Để máy tính ở chế độ radian.\n' +
      '— Kết quả vô lý: cạnh góc vuông không thể dài hơn cạnh huyền; nếu ra như vậy là đã dùng sai hệ thức.',
    workedExample: {
      problem:
        'a) Cho tam giác ABC vuông tại A có BC = 20 cm, góc B = 30°. Tính AC, AB (làm tròn đến hàng phần trăm) và số đo góc C. ' +
        'b) Một bạn học sinh đứng cách chân cột cờ 12 m, nhìn lên đỉnh cột dưới góc nâng 45°. Mắt bạn cách mặt đất 1,6 m. Tính chiều cao cột cờ.',
      steps: [
        'a) Góc C = 90° − 30° = 60°.',
        'a) AC là cạnh đối của góc B nên AC = BC · sin B = 20 · sin 30° = 20 · 1/2 = 10 cm.',
        'a) AB là cạnh kề của góc B nên AB = BC · cos B = 20 · cos 30° = 20 · √3/2 = 10√3 ≈ 17,32 cm.',
        'a) Kiểm tra bằng Pythagore: AB² + AC² = 300 + 100 = 400 = BC².',
        'b) Phần cột cao hơn mắt tạo với tia nhìn và phương ngang một tam giác vuông cân (góc nâng 45°).',
        'b) Phần cao hơn mắt: 12 · tan 45° = 12 · 1 = 12 m.',
        'b) Chiều cao cột cờ: 12 + 1,6 = 13,6 m.',
      ],
      answer: 'a) C = 60°; AC = 10 cm; AB ≈ 17,32 cm. b) Cột cờ cao 13,6 m.',
    },
    checkQuestions: [
      {
        prompt: 'Tam giác ABC vuông tại A có BC = 12 cm và góc B = 30°. Tính độ dài AC theo cm.',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'AC là cạnh đối của góc B nên AC = BC · sin B = 12 · sin 30° = 12 · 1/2 = 6 (cm). ' +
          'Lỗi hay gặp là dùng cos B và ra 12 · √3/2 ≈ 10,39: đó là độ dài AB (cạnh kề), không phải AC.',
      },
      {
        prompt:
          'Tam giác ABC vuông tại A có AB = 8 cm và góc B = 60°. Độ dài AC có dạng k√3 cm. Hãy nhập hệ số k.',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'AC là cạnh đối, AB là cạnh kề của góc B nên AC = AB · tan B = 8 · tan 60° = 8√3 (cm), do đó k = 8. ' +
          'Lỗi hay gặp là nhầm tan 60° = √3/3 nên ra 8√3/3, hoặc nhân AB với cos 60° (cos dùng cho cạnh huyền, không dùng cho hai cạnh góc vuông).',
      },
      {
        prompt: 'Hệ thức nào dưới đây luôn đúng với mọi tam giác ABC vuông tại A?',
        choices: [
          { id: 'a', label: 'AB = BC · sin B' },
          { id: 'b', label: 'AC = AB · cot B' },
          { id: 'c', label: 'AB = BC · cos B' },
          { id: 'd', label: 'AC = BC · cos B' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'AB là cạnh kề của góc B nên AB = BC · cos B, đáp án c đúng. Đáp án a và d nhầm sin với cos; ' +
          'b sai vì AC là cạnh đối của B nên AC = AB · tan B (cot B = AB/AC là tỉ số ngược lại).',
      },
      {
        prompt:
          'Một người đứng cách chân một ngọn tháp 40 m, nhìn lên đỉnh tháp dưới góc nâng 35°. Mắt người đó cách mặt đất 1,6 m. ' +
          'Dùng máy tính cầm tay, tính chiều cao của tháp theo mét, làm tròn đến hàng phần mười. Nhập kết quả dưới dạng số thập phân.',
        answer: { kind: 'numeric', value: 29.6, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          'Phần tháp cao hơn mắt là 40 · tan 35° ≈ 40 · 0,7002 ≈ 28,0 m. Cộng chiều cao mắt: 28,0 + 1,6 ≈ 29,6 (m). ' +
          'Lỗi hay gặp là quên cộng 1,6 m của mắt (ra 28,0), hoặc làm tròn tan 35° ≈ 0,7 sớm nên kết quả lệch.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hệ thức cạnh góc vuông theo cạnh huyền và góc nhọn?',
        dap: 'Cạnh góc vuông = cạnh huyền · sin góc đối = cạnh huyền · cos góc kề. Ví dụ AC = BC · sin B = BC · cos C.',
      },
      {
        hoi: 'Hệ thức cạnh góc vuông theo cạnh góc vuông kia?',
        dap: 'Cạnh góc vuông = cạnh kia · tan góc đối = cạnh kia · cot góc kề. Ví dụ AC = AB · tan B.',
      },
      {
        hoi: 'Giải tam giác vuông nghĩa là gì và dùng những công cụ nào?',
        dap: 'Tìm tất cả cạnh, góc chưa biết. Dùng B + C = 90°, định lí Pythagore và các hệ thức cạnh góc.',
      },
      {
        hoi: 'Chiều cao vật khi đứng cách chân vật d, góc nâng α, mắt cao h?',
        dap: 'Chiều cao = d · tan α + h. Đừng quên cộng chiều cao của mắt.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
