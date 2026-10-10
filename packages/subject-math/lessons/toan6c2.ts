// lessons/toan6c2.ts — Toán 6, Chương 2: Tính chia hết trong tập hợp các số tự nhiên.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C2_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c2-b1',
    grade: '6',
    chapterNumber: 2,
    chapterTitle: 'Tính chia hết trong tập hợp các số tự nhiên',
    lessonNumber: 1,
    title: 'Quan hệ chia hết và các dấu hiệu chia hết cho 2, 3, 5, 9',
    hook:
      'Lớp 6B có 36 bạn xếp hàng chào cờ. Cô muốn xếp thành các hàng đều nhau: 4 hàng thì mỗi hàng 9 bạn, 6 hàng thì mỗi hàng 6 bạn, ' +
      'nhưng 5 hàng thì dư mất 1 bạn. Nếu khối có 135 bạn thì sao, có chia đều được thành 9 tổ không? ' +
      'Không cần bấm máy hay đặt tính dài, chỉ cần nhìn các chữ số là đoán được. Đó là các dấu hiệu chia hết.',
    theory:
      'QUAN HỆ CHIA HẾT\n' +
      'Với a, b ∈ ℕ và b ≠ 0: nếu có số tự nhiên q sao cho a = b · q thì a chia hết cho b, viết a ⋮ b. ' +
      'Khi đó b là ước của a, còn a là bội của b. Ví dụ 12 = 4 · 3 nên 12 ⋮ 4, ta nói 4 là ước của 12 và 12 là bội của 4.\n' +
      'Tập hợp các ước của a kí hiệu Ư(a); tập hợp các bội của b kí hiệu B(b). ' +
      'Ví dụ Ư(12) = {1; 2; 3; 4; 6; 12} và B(4) = {0; 4; 8; 12; 16; …}. ' +
      'Chú ý: ước của một số khác 0 thì HỮU HẠN, còn bội thì VÔ HẠN. Số 1 là ước của mọi số; số 0 là bội của mọi số khác 0.\n\n' +
      'TÍNH CHẤT CHIA HẾT CỦA MỘT TỔNG\n' +
      '— Nếu a ⋮ m và b ⋮ m thì (a + b) ⋮ m; cũng vậy (a − b) ⋮ m với a ≥ b.\n' +
      '— Nếu a ⋮ m còn b không chia hết cho m thì (a + b) không chia hết cho m.\n' +
      'Ví dụ 24 + 15 chia hết cho 3 vì cả 24 và 15 đều chia hết cho 3.\n\n' +
      'DẤU HIỆU CHIA HẾT\n' +
      '— Cho 2: chữ số tận cùng là 0, 2, 4, 6 hoặc 8 (số chẵn).\n' +
      '— Cho 5: chữ số tận cùng là 0 hoặc 5.\n' +
      '— Cho 3: tổng các chữ số chia hết cho 3.\n' +
      '— Cho 9: tổng các chữ số chia hết cho 9.\n' +
      'VÌ SAO? Số 10, 100, 1 000… đều chia hết cho 2 và 5, nên chỉ chữ số tận cùng quyết định chia hết cho 2 hoặc 5. ' +
      'Còn 10 = 9 + 1, 100 = 99 + 1, 1 000 = 999 + 1… mỗi luỹ thừa của 10 hơn một bội của 9 đúng 1 đơn vị. ' +
      'Chẳng hạn 2 358 = 2 · 999 + 3 · 99 + 5 · 9 + (2 + 3 + 5 + 8): phần đầu luôn chia hết cho 9 (và cho 3), ' +
      'nên số dư chỉ phụ thuộc tổng các chữ số 2 + 3 + 5 + 8 = 18.\n' +
      'Số chia hết cho 9 thì chia hết cho 3 (vì 3 là ước của 9). Chiều ngược lại SAI: 12 ⋮ 3 nhưng 12 không chia hết cho 9.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng chữ số tận cùng để xét chia hết cho 3 hoặc 9. Phải cộng TẤT CẢ các chữ số.\n' +
      '— Cho rằng chia hết cho 3 thì chia hết cho 9.\n' +
      '— Nhầm ước với bội: 4 là ước của 12, không phải bội của 12.\n' +
      '— Quên rằng số 0 là bội của mọi số khác 0, và 1 là ước của mọi số.',
    workedExample: {
      problem:
        'Cho số 4x7, trong đó x là một chữ số. ' +
        'a) Tìm tất cả các chữ số x để 4x7 chia hết cho 3. ' +
        'b) Tìm chữ số x để 4x7 chia hết cho 9.',
      steps: [
        'Tổng các chữ số của 4x7 là 4 + x + 7 = 11 + x. Vì x là chữ số nên 0 ≤ x ≤ 9, suy ra 11 ≤ 11 + x ≤ 20.',
        'Phần a): 11 + x phải chia hết cho 3. Trong khoảng từ 11 đến 20, các bội của 3 là 12, 15 và 18.',
        'Từ 11 + x = 12, 15, 18 ta được x = 1, 4, 7.',
        'Phần b): 11 + x phải chia hết cho 9. Trong khoảng từ 11 đến 20 chỉ có số 18 chia hết cho 9, nên 11 + x = 18 và x = 7.',
        'Kiểm tra: 477 = 9 · 53 nên đúng chia hết cho 9.',
      ],
      answer: 'a) x ∈ {1; 4; 7}. b) x = 7.',
    },
    checkQuestions: [
      {
        prompt: 'Số nào sau đây chia hết cho cả 2 và 5?',
        choices: [
          { id: 'a', label: '1 205' },
          { id: 'b', label: '3 480' },
          { id: 'c', label: '726' },
          { id: 'd', label: '915' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Số chia hết cho cả 2 và 5 phải có chữ số tận cùng là 0, mà chỉ có 3 480 thoả. Số 1 205 và 915 tận cùng bằng 5 (chia hết cho 5 nhưng lẻ), còn 726 tận cùng bằng 6 (chẵn nhưng không chia hết cho 5).',
      },
      {
        prompt: 'Có bao nhiêu số tự nhiên là ước của 18?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Các ước của 18 là 1, 2, 3, 6, 9, 18, tức 6 số. Lỗi hay gặp là bỏ sót ước 1 và ước 18 (chính nó), hoặc liệt kê cả 4, 5 vì 18 : 4 và 18 : 5 không chia hết.',
      },
      {
        prompt: 'Cho số 4 725. Khẳng định nào sau đây đúng?',
        choices: [
          { id: 'a', label: '4 725 chia hết cho 2' },
          { id: 'b', label: '4 725 chia hết cho cả 5 và 9' },
          { id: 'c', label: '4 725 chia hết cho 3 nhưng không chia hết cho 9' },
          { id: 'd', label: '4 725 không chia hết cho 3' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Tổng các chữ số là 4 + 7 + 2 + 5 = 18, chia hết cho 9 (và cho 3), và chữ số tận cùng là 5 nên chia hết cho 5. Số này lẻ nên không chia hết cho 2. Lỗi hay gặp là cho rằng chia hết cho 3 thì không thể chia hết cho 9.',
      },
      {
        prompt:
          'Một bác bán trứng có 3a5 quả (a là một chữ số). Bác xếp vào các hộp, mỗi hộp 9 quả thì vừa đủ, không thừa quả nào. Tìm chữ số a.',
        answer: { kind: 'numeric', value: 1 },
        explain:
          'Số quả chia hết cho 9 nên tổng chữ số 3 + a + 5 = 8 + a phải chia hết cho 9. Vì 8 ≤ 8 + a ≤ 17 nên 8 + a = 9, suy ra a = 1 (315 = 9 · 35). Lỗi hay gặp là chỉ xét chữ số tận cùng, hoặc chọn a = 10 (không phải chữ số).',
      },
    ],
    srsCards: [
      {
        hoi: 'Dấu hiệu chia hết cho 3 và cho 9?',
        dap: 'Tổng các chữ số chia hết cho 3 (hoặc cho 9) thì số đó chia hết cho 3 (hoặc cho 9).',
      },
      {
        hoi: 'Dấu hiệu chia hết cho 2 và cho 5?',
        dap: 'Cho 2: chữ số tận cùng là 0, 2, 4, 6, 8. Cho 5: chữ số tận cùng là 0 hoặc 5.',
      },
      {
        hoi: 'Ước và bội khác nhau thế nào?',
        dap: 'Nếu a = b · q thì b là ước của a và a là bội của b. Ước của một số khác 0 là hữu hạn, bội thì vô hạn.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c2-b2',
    grade: '6',
    chapterNumber: 2,
    chapterTitle: 'Tính chia hết trong tập hợp các số tự nhiên',
    lessonNumber: 2,
    title: 'Số nguyên tố và phân tích một số ra thừa số nguyên tố',
    hook:
      'Bạn Minh có 13 chiếc bánh trung thu nhỏ và muốn xếp đều vào các hộp. Thử mãi mà chỉ có hai cách: ' +
      '13 hộp mỗi hộp 1 chiếc, hoặc 1 hộp đựng cả 13 chiếc. Còn với 12 chiếc thì xếp được nhiều kiểu: ' +
      '2 hộp, 3 hộp, 4 hộp, 6 hộp. Những số "khó chia" như 13 được gọi là số nguyên tố, ' +
      'và chúng là những "viên gạch" tạo nên mọi số tự nhiên.',
    theory:
      'SỐ NGUYÊN TỐ VÀ HỢP SỐ\n' +
      '— Số nguyên tố là số tự nhiên lớn hơn 1, chỉ có đúng hai ước là 1 và chính nó. Ví dụ 2, 3, 5, 7, 11, 13.\n' +
      '— Hợp số là số tự nhiên lớn hơn 1, có nhiều hơn hai ước. Ví dụ 4, 6, 9, 12, 15.\n' +
      '— Số 0 và số 1 không phải số nguyên tố, cũng không phải hợp số.\n' +
      '— Số 2 là số nguyên tố chẵn duy nhất, vì mọi số chẵn lớn hơn 2 đều có thêm ước 2.\n' +
      'Các số nguyên tố nhỏ hơn 50: 2; 3; 5; 7; 11; 13; 17; 19; 23; 29; 31; 37; 41; 43; 47.\n\n' +
      'CÁCH KIỂM TRA MỘT SỐ NHỎ CÓ NGUYÊN TỐ KHÔNG\n' +
      'Với số nhỏ hơn 100, em thử chia lần lượt cho các số nguyên tố 2, 3, 5, 7 (dùng dấu hiệu chia hết). ' +
      'Nếu không chia hết cho số nào thì đó là số nguyên tố. VÌ SAO chỉ cần thử tới 7? Nếu số n là hợp số, ' +
      'n = a · b với a ≤ b thì a · a ≤ n, nên ước nhỏ nhất a phải khá bé. Với n < 100 thì a < 10, tức a ≤ 7 khi a nguyên tố. ' +
      'Ví dụ 91 không chia hết cho 2, 3, 5 nhưng 91 = 7 · 13 nên là hợp số.\n\n' +
      'PHÂN TÍCH MỘT SỐ RA THỪA SỐ NGUYÊN TỐ\n' +
      'Phân tích một số lớn hơn 1 ra thừa số nguyên tố là viết nó thành tích của các số nguyên tố. ' +
      'Cách làm: chia dần cho các số nguyên tố nhỏ nhất có thể (2, rồi 3, rồi 5…) cho tới khi thương bằng 1. ' +
      'Ví dụ 60 : 2 = 30; 30 : 2 = 15; 15 : 3 = 5; 5 : 5 = 1. Vậy 60 = 2 · 2 · 3 · 5 = 2² · 3 · 5.\n' +
      'Kết quả là DUY NHẤT nếu không kể thứ tự các thừa số. Nhờ vậy, mỗi số tự nhiên lớn hơn 1 có "dấu vân tay" riêng. ' +
      'Biết dấu vân tay đó, em suy ra mọi ước của số, và sẽ dùng nó để tìm ƯCLN, BCNN ở bài sau.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Coi 1 là số nguyên tố. 1 chỉ có MỘT ước nên không thoả "đúng hai ước".\n' +
      '— Cho rằng mọi số lẻ đều nguyên tố: 9, 15, 21, 51 đều là hợp số.\n' +
      '— Quên 2 là số nguyên tố vì thấy nó chẵn.\n' +
      '— Dừng khi chưa xong: 36 = 4 · 9 chưa phải phân tích ra thừa số nguyên tố, vì 4 và 9 còn là hợp số. Phải viết 36 = 2² · 3².\n' +
      '— Viết thiếu số mũ, ví dụ 60 = 2 · 3 · 5 (thiếu một thừa số 2).',
    workedExample: {
      problem:
        'Phân tích số 360 ra thừa số nguyên tố, rồi cho biết 360 chia hết cho những số nguyên tố nào.',
      steps: [
        '360 : 2 = 180.',
        '180 : 2 = 90 và 90 : 2 = 45. Đến đây 45 là số lẻ nên không chia hết cho 2 nữa.',
        '45 : 3 = 15 và 15 : 3 = 5 (tổng các chữ số của 45 là 9 nên chia hết cho 3).',
        '5 : 5 = 1, kết thúc. Các thừa số đã chia là 2, 2, 2, 3, 3, 5.',
        'Gộp lại: 360 = 2³ · 3² · 5. Kiểm tra: 8 · 9 · 5 = 360.',
        'Các số nguyên tố xuất hiện là 2, 3, 5 nên 360 chia hết cho 2, 3 và 5.',
      ],
      answer: '360 = 2³ · 3² · 5; 360 chia hết cho các số nguyên tố 2, 3, 5.',
    },
    checkQuestions: [
      {
        prompt: 'Số nào sau đây là số nguyên tố?',
        choices: [
          { id: 'a', label: '1' },
          { id: 'b', label: '21' },
          { id: 'c', label: '29' },
          { id: 'd', label: '51' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          '29 không chia hết cho 2, 3, 5 nên chỉ có hai ước là 1 và 29. Số 1 không phải số nguyên tố (chỉ có một ước), 21 = 3 · 7 và 51 = 3 · 17 đều là hợp số dù là số lẻ.',
      },
      {
        prompt: 'Có bao nhiêu số nguyên tố nhỏ hơn 20?',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'Đó là 2, 3, 5, 7, 11, 13, 17, 19, tức 8 số. Lỗi hay gặp là bỏ sót số 2 (vì nghĩ số chẵn thì không nguyên tố) hoặc đếm nhầm cả số 1.',
      },
      {
        prompt: 'Phân tích 90 ra thừa số nguyên tố được 90 = 2 · 3ᵃ · 5. Tìm số mũ a.',
        answer: { kind: 'numeric', value: 2 },
        explain:
          '90 : 2 = 45, 45 : 3 = 15, 15 : 3 = 5, 5 : 5 = 1 nên thừa số 3 xuất hiện hai lần, 90 = 2 · 3² · 5 và a = 2. Lỗi hay gặp là dừng ở 90 = 2 · 3 · 15 trong khi 15 vẫn là hợp số.',
      },
      {
        prompt:
          'Bạn Minh có 17 viên bi. Hỏi có bao nhiêu cách chia số bi đó vào các túi có số bi bằng nhau, với số túi từ 2 trở lên và mỗi túi có từ 2 viên trở lên? (Nhập 0 nếu không có cách nào.)',
        answer: { kind: 'numeric', value: 0 },
        explain:
          'Chia đều nghĩa là số túi và số bi mỗi túi đều là ước của 17. Vì 17 là số nguyên tố, chỉ có ước 1 và 17, nên không có cách nào thoả cả hai điều kiện "từ 2 trở lên". Lỗi hay gặp là nghĩ 17 chia được cho 3 hoặc 4 túi.',
      },
    ],
    srsCards: [
      {
        hoi: 'Số nguyên tố là gì? Hợp số là gì?',
        dap: 'Số nguyên tố: lớn hơn 1 và chỉ có hai ước là 1 và chính nó. Hợp số: lớn hơn 1 và có nhiều hơn hai ước.',
      },
      {
        hoi: 'Kể các số nguyên tố nhỏ hơn 20.',
        dap: '2, 3, 5, 7, 11, 13, 17, 19. Chú ý số 1 không phải, và 2 là số nguyên tố chẵn duy nhất.',
      },
      {
        hoi: 'Phân tích 60 ra thừa số nguyên tố.',
        dap: '60 = 2 · 2 · 3 · 5 = 2² · 3 · 5 (chia dần cho 2, 2, 3, 5).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c2-b3',
    grade: '6',
    chapterNumber: 2,
    chapterTitle: 'Tính chia hết trong tập hợp các số tự nhiên',
    lessonNumber: 3,
    title: 'Ước chung lớn nhất và bội chung nhỏ nhất',
    hook:
      'Cô giáo có 24 quyển truyện và 36 quyển vở, muốn chia thành các phần quà giống hệt nhau, ' +
      'mỗi phần có cả truyện lẫn vở và không thừa quyển nào. Nhiều nhất chia được bao nhiêu phần? ' +
      'Một chuyện khác: An trực nhật 4 ngày một lần, Bình 6 ngày một lần, hôm nay hai bạn trực cùng nhau. ' +
      'Bao giờ hai bạn lại trực cùng nhau? Hai câu đố nghe na ná nhau nhưng dùng hai công cụ khác nhau: ƯCLN và BCNN.',
    theory:
      'ƯỚC CHUNG LỚN NHẤT (ƯCLN)\n' +
      'Ước chung của a và b là số vừa là ước của a vừa là ước của b; tập hợp đó kí hiệu ƯC(a, b). ' +
      'Số lớn nhất trong các ước chung gọi là ước chung lớn nhất, kí hiệu ƯCLN(a, b).\n' +
      'Cách tìm bằng phân tích thừa số nguyên tố: (1) phân tích mỗi số; (2) chọn các thừa số nguyên tố CHUNG; ' +
      '(3) mỗi thừa số lấy với số mũ NHỎ NHẤT; (4) nhân lại. ' +
      'Ví dụ 24 = 2³ · 3 và 36 = 2² · 3². Thừa số chung là 2 và 3, mũ nhỏ nhất lần lượt là 2 và 1, ' +
      'nên ƯCLN(24, 36) = 2² · 3 = 12.\n' +
      'VÌ SAO lấy mũ nhỏ nhất? Một ước chung phải chia hết cho cả hai số, nên số lần xuất hiện của mỗi thừa số trong nó ' +
      'không được vượt quá số lần ở số nào ít hơn. Mọi ước chung đều là ước của ƯCLN: ƯC(24, 36) = Ư(12) = {1; 2; 3; 4; 6; 12}.\n' +
      'Hai số có ƯCLN bằng 1 gọi là nguyên tố cùng nhau, ví dụ 8 và 15. Nếu a ⋮ b thì ƯCLN(a, b) = b.\n\n' +
      'BỘI CHUNG NHỎ NHẤT (BCNN)\n' +
      'Bội chung của a và b là số vừa là bội của a vừa là bội của b. Số nhỏ nhất khác 0 trong các bội chung gọi là ' +
      'bội chung nhỏ nhất, kí hiệu BCNN(a, b).\n' +
      'Cách tìm: (1) phân tích mỗi số ra thừa số nguyên tố; (2) chọn các thừa số nguyên tố CHUNG VÀ RIÊNG; ' +
      '(3) mỗi thừa số lấy với số mũ LỚN NHẤT; (4) nhân lại. ' +
      'Ví dụ 4 = 2² và 6 = 2 · 3 thì BCNN(4, 6) = 2² · 3 = 12.\n' +
      'Mẹo nhớ: ƯCLN là "chung, mũ nhỏ"; BCNN là "chung và riêng, mũ lớn". ' +
      'Kiểm tra nhanh với hai số: a · b = ƯCLN(a, b) · BCNN(a, b). Chẳng hạn 24 · 36 = 864 = 12 · 72 (BCNN(24, 36) = 2³ · 3² = 72).\n\n' +
      'ỨNG DỤNG\n' +
      '— Rút gọn phân số: chia cả tử và mẫu cho ƯCLN của chúng được phân số tối giản. ' +
      'Ví dụ 24/36 = (24 : 12)/(36 : 12) = 2/3.\n' +
      '— Bài toán chia đều, cắt đều, xếp hàng "nhiều nhất" thì dùng ƯCLN (số lớn nhất mà cả hai số đều chia hết).\n' +
      '— Bài toán "bao giờ gặp lại", "lặp lại cùng lúc", "ít nhất" thì dùng BCNN (số nhỏ nhất mà cả hai số đều là ước).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Lấy mọi thừa số nguyên tố (kể cả riêng) khi tìm ƯCLN, hoặc chỉ lấy thừa số chung khi tìm BCNN.\n' +
      '— Nhầm số mũ nhỏ nhất với lớn nhất.\n' +
      '— Quên thừa số riêng khi tìm BCNN: BCNN(12, 18) phải có cả 2² (của 12) và 3² (của 18).\n' +
      '— Nhầm dạng bài toán: "chia nhiều nhất" là ƯCLN, "gặp lại sớm nhất" là BCNN.',
    workedExample: {
      problem: 'Tìm ƯCLN(18, 30) và BCNN(18, 30), rồi rút gọn phân số 18/30.',
      steps: [
        'Phân tích: 18 = 2 · 3² và 30 = 2 · 3 · 5.',
        'ƯCLN: thừa số chung là 2 và 3, mũ nhỏ nhất đều là 1, nên ƯCLN(18, 30) = 2 · 3 = 6.',
        'BCNN: lấy cả thừa số chung và riêng là 2, 3, 5 với mũ lớn nhất (2¹, 3², 5¹), nên BCNN(18, 30) = 2 · 3² · 5 = 90.',
        'Kiểm tra: 6 · 90 = 540 và 18 · 30 = 540, khớp nhau.',
        'Rút gọn: 18/30 = (18 : 6)/(30 : 6) = 3/5, và 3/5 đã tối giản vì ƯCLN(3, 5) = 1.',
      ],
      answer: 'ƯCLN(18, 30) = 6; BCNN(18, 30) = 90; 18/30 = 3/5.',
    },
    checkQuestions: [
      {
        prompt: 'Bài toán nào sau đây cần dùng BCNN?',
        choices: [
          {
            id: 'a',
            label: 'Chia 24 quyển truyện và 36 quyển vở thành nhiều phần quà giống nhau nhất',
          },
          {
            id: 'b',
            label:
              'Hai xe buýt cùng rời bến lúc 6 giờ, xe A cứ 15 phút một chuyến, xe B cứ 20 phút một chuyến; hỏi bao lâu nữa hai xe lại cùng rời bến',
          },
          {
            id: 'c',
            label: 'Cắt tấm vải 48 cm và 60 cm thành các mảnh bằng nhau, dài nhất có thể',
          },
          { id: 'd', label: 'Rút gọn phân số 42/56' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Việc hai xe "lại cùng rời bến" là bài toán gặp lại cùng lúc, tìm số nhỏ nhất chia hết cho cả 15 và 20, nên dùng BCNN. Ba bài còn lại đều là chia đều, cắt đều hoặc rút gọn, tức là dùng ƯCLN. Lỗi hay gặp là nhầm hai dạng bài.',
      },
      {
        prompt: 'Tìm BCNN(12, 18).',
        answer: { kind: 'numeric', value: 36 },
        explain:
          '12 = 2² · 3 và 18 = 2 · 3². Lấy cả thừa số chung và riêng với mũ lớn nhất: 2² · 3² = 36. Lỗi hay gặp là lấy mũ nhỏ nhất (ra 6, đó là ƯCLN) hoặc nhân hai số rồi quên chia (12 · 18 = 216).',
      },
      {
        prompt: 'Rút gọn phân số 42/56 về phân số tối giản.',
        answer: { kind: 'fraction', num: 3, den: 4, requireSimplified: true },
        explain:
          '42 = 2 · 3 · 7 và 56 = 2³ · 7 nên ƯCLN(42, 56) = 2 · 7 = 14. Chia cả tử và mẫu cho 14 được 3/4, tối giản. Lỗi hay gặp là chỉ chia cho 2 (ra 21/28) rồi dừng, hoặc chia tử và mẫu cho hai số khác nhau.',
      },
      {
        prompt:
          'Cô có 48 chiếc bút và 60 quyển vở, muốn chia thành các phần thưởng giống hệt nhau, mỗi phần có cả bút lẫn vở và không thừa cái nào. Nhiều nhất chia được bao nhiêu phần thưởng?',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Số phần thưởng phải là ước chung của 48 và 60, và ta cần số lớn nhất nên đó là ƯCLN(48, 60). Có 48 = 2⁴ · 3 và 60 = 2² · 3 · 5 nên ƯCLN = 2² · 3 = 12. Lỗi hay gặp là tính BCNN (240) hoặc chỉ lấy ước chung bất kỳ như 6.',
      },
    ],
    srsCards: [
      {
        hoi: 'Cách tìm ƯCLN bằng phân tích thừa số nguyên tố?',
        dap: 'Chọn các thừa số nguyên tố CHUNG, mỗi thừa số lấy số mũ NHỎ NHẤT, rồi nhân lại.',
      },
      {
        hoi: 'Cách tìm BCNN bằng phân tích thừa số nguyên tố?',
        dap: 'Chọn các thừa số nguyên tố chung và riêng, mỗi thừa số lấy số mũ LỚN NHẤT, rồi nhân lại.',
      },
      {
        hoi: 'Rút gọn phân số bằng ƯCLN như thế nào?',
        dap: 'Chia cả tử và mẫu cho ƯCLN của chúng để được phân số tối giản. Ví dụ 24/36 = 2/3 vì ƯCLN(24, 36) = 12.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
