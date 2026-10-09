// sinhhsgditruyen.ts — Chuyên đề bồi dưỡng HỌC SINH GIỎI môn Sinh học, mảng DI TRUYỀN HỌC.
//
// Đánh số chương 93 để tách hẳn khỏi các chương của chương trình chuẩn mà vẫn giữ đúng khuôn id
// `sinh<lớp>-c<chương>-b<bài>` do BiologyLessonSchema quy định (tiền lệ: `lyhsg*` của môn Lí).
// Ba bài đi từ dễ lên khó theo đúng ba cấp kì thi thật ở Việt Nam:
//   b1 (hsg-truong)    — di truyền quần thể: đếm bản sao allele, phép thử cân bằng, tự phối, gene trên X.
//   b2 (hsg-tinh)      — liên kết và hoán vị gene: đọc tỉ lệ kiểu hình để suy ngược tần số hoán vị.
//   b3 (hsg-quoc-gia)  — xác suất trong phả hệ: xác suất có điều kiện, người lấy từ quần thể,
//                        và lỗi nhân các xác suất không độc lập.
// Câu numeric có đáp số phân số được quy về số thập phân làm tròn 4 chữ số, dung sai tuyệt đối
// 0,0001 — học sinh gõ phân số (1/18) cũng được engine tính ra và chấm đúng.
import type { BiologyLesson } from '../lessonTypes.js'

export const SINH_HSG_DI_TRUYEN_LESSONS: BiologyLesson[] = [
  {
    id: 'sinh12-c93-b1',
    grade: '12',
    chapterNumber: 93,
    chapterTitle: 'Chuyên đề HSG: Di truyền học',
    lessonNumber: 1,
    title: 'Bài toán quần thể: tần số allele, cân bằng Hardy–Weinberg và tự phối',
    hook:
      'Chủ một trại gà ri ở Bắc Giang thấy cứ 100 gà con nở ra thì có khoảng 4 con lông trắng — tính trạng lặn ông không muốn. ' +
      'Ông định loại hết gà lông trắng là xong. Nhưng nếu đàn đang cân bằng di truyền thì tần số allele trắng là 0,2, và cứ ' +
      '3 con gà lông màu lại có 1 con mang ẩn allele trắng. Loại gà trắng chỉ chạm được phần nổi của tảng băng. ' +
      'Bài này dạy cách đếm phần chìm đó.',
    theory:
      '## Hai cách đếm, một đại lượng\n' +
      '— Tần số kiểu gene là tỉ lệ CÁ THỂ; tần số allele là tỉ lệ BẢN SAO của gene. Mỗi cá thể lưỡng bội mang hai bản sao ' +
      'của một gene trên nhiễm sắc thể (NST) thường, nên quần thể N cá thể có 2N bản sao. Vì thế p(A) = (2·n_AA + n_Aa) / 2N. ' +
      'Khi đã có tần số kiểu gene x AA + y Aa + z aa thì gọn hơn: p = x + y/2, q = z + y/2.\n' +
      '— Bẫy hay gặp: chia cho N thay vì 2N, hoặc quên rằng cá thể Aa góp MỘT allele A chứ không phải hai.\n\n' +
      '## Vì sao cân bằng Hardy–Weinberg có dạng p² + 2pq + q²\n' +
      '— Trong quần thể ngẫu phối, mỗi hợp tử giống như được tạo bằng cách bốc ngẫu nhiên một giao tử đực và một giao tử cái ' +
      'từ vốn gene chung. Xác suất bốc được A là p, được a là q, hai lần bốc độc lập. Vậy AA = p·p, aa = q·q, còn Aa = 2pq vì ' +
      'có HAI đường: A từ bố và a từ mẹ, hoặc ngược lại.\n' +
      '— Điều kiện: quần thể đủ lớn, ngẫu phối, không đột biến, không chọn lọc, không di – nhập gene. Thiếu điều kiện nào ' +
      'thì công thức chỉ còn là phép gần đúng.\n' +
      '— Với gene trên NST thường và tần số allele ở hai giới như nhau, CHỈ MỘT thế hệ ngẫu phối là quần thể đạt cân bằng, ' +
      'bất kể cấu trúc ban đầu ra sao.\n\n' +
      '## Kiểm tra một quần thể đã cân bằng chưa\n' +
      'Cách nhanh: quần thể x AA + y Aa + z aa cân bằng khi và chỉ khi x·z = (y/2)². Lí do: ở trạng thái cân bằng x = p², ' +
      'z = q², y/2 = pq, nên x·z = p²q² = (y/2)². Cách chắc: tính p, q rồi so p², 2pq, q² với số liệu.\n' +
      'BẪY LỚN NHẤT: suy q = √(tần số aa) từ tỉ lệ kiểu hình lặn chỉ đúng khi ĐÃ BIẾT quần thể cân bằng. Với quần thể tự phối ' +
      'hay quần thể vừa nhập đàn, phép khai căn cho số sai.\n\n' +
      '## Quần thể tự phối\n' +
      '— Mỗi thế hệ tự phối, cá thể AA chỉ sinh AA, aa chỉ sinh aa, còn Aa sinh 1/4 AA : 1/2 Aa : 1/4 aa. Vậy phần dị hợp ' +
      'giảm ĐÚNG MỘT NỬA mỗi thế hệ, và nửa mất đi chia đều cho hai bên đồng hợp.\n' +
      '— Sau n thế hệ từ x AA + y Aa + z aa: Aa = y/2ⁿ; AA = x + (y − y/2ⁿ)/2; aa = z + (y − y/2ⁿ)/2.\n' +
      '— Tần số allele KHÔNG đổi qua tự phối (chỉ cách allele ghép cặp thay đổi), nên tự phối không bao giờ đưa quần thể về ' +
      'cân bằng Hardy–Weinberg. Bẫy: áp công thức [1 − (1/2)ⁿ]/2 của quần thể 100% Aa cho quần thể có sẵn AA và aa.\n\n' +
      '## Gene trên NST X (không có allele trên Y)\n' +
      '— Giới XY chỉ có một bản sao, nên ở nam tần số kiểu hình bằng luôn tần số allele: nam bị bệnh lặn = q. Giới XX có ' +
      'hai bản sao: nữ bị bệnh = q², nữ mang allele bệnh (dị hợp) = 2pq.\n' +
      '— Hệ quả: bệnh lặn trên X gặp ở nam nhiều hơn hẳn ở nữ, theo tỉ lệ q : q². Bẫy: khai căn tỉ lệ nam bị bệnh để tìm q — ' +
      'sai, vì ở nam không có bình phương nào để khai căn.\n' +
      '— Nếu tần số allele ở hai giới khác nhau, quần thể KHÔNG cân bằng sau một thế hệ: con trai nhận X từ mẹ nên q ở nam ' +
      'đời sau bằng q ở nữ đời trước, còn q ở nữ đời sau là trung bình cộng của hai giới. Chênh lệch giữa hai giới giảm một ' +
      'nửa và đổi dấu mỗi thế hệ, nên cân bằng chỉ đạt dần dần.',
    workedExample: {
      problem:
        'Một quần thể ngô có 800 cây, tính trạng do một gene hai allele trên NST thường quy định (A trội hoàn toàn so với a). ' +
        'Bằng lai kiểm tra, người ta xác định được 360 cây AA, 320 cây Aa và 120 cây aa. (a) Tính tần số allele. (b) Quần thể ' +
        'đã cân bằng Hardy–Weinberg chưa? (c) Cho giao phấn ngẫu nhiên một thế hệ, cấu trúc di truyền thế nào? (d) Nếu thay ' +
        'vào đó cho tự thụ phấn bắt buộc 2 thế hệ liên tiếp thì sao?',
      steps: [
        'Bước 1 — Đổi số cá thể ra tần số kiểu gene: x = 360/800 = 0,45; y = 320/800 = 0,40; z = 120/800 = 0,15. Tự kiểm: 0,45 + 0,40 + 0,15 = 1.',
        'Bước 2 — Tần số allele (đếm bản sao, không đếm cá thể): p = x + y/2 = 0,45 + 0,20 = 0,65; q = z + y/2 = 0,15 + 0,20 = 0,35. Kiểm bằng đếm trực tiếp: số allele A = 2 × 360 + 320 = 1040 trên tổng 1600 bản sao, đúng bằng 0,65.',
        'Bước 3 — Kiểm tra cân bằng bằng phép thử x·z so với (y/2)²: x·z = 0,45 × 0,15 = 0,0675, còn (y/2)² = 0,2² = 0,04. Hai số khác nhau nên quần thể CHƯA cân bằng — thừa đồng hợp, thiếu dị hợp so với kì vọng 2pq = 0,455.',
        'Bước 4 — Giao phấn ngẫu nhiên một thế hệ: gene trên NST thường nên một thế hệ là đủ để đạt cân bằng với đúng p, q cũ: AA = 0,65² = 0,4225; Aa = 2 × 0,65 × 0,35 = 0,455; aa = 0,35² = 0,1225. Tự kiểm: 0,4225 + 0,455 + 0,1225 = 1.',
        'Bước 5 — Tự thụ phấn 2 thế hệ, làm từ quần thể BAN ĐẦU chứ không phải từ kết quả bước 4: Aa = 0,40/2² = 0,10. Phần dị hợp mất đi là 0,40 − 0,10 = 0,30, chia đôi cho hai bên: AA = 0,45 + 0,15 = 0,60; aa = 0,15 + 0,15 = 0,30.',
        'Bước 6 — Tự kiểm bằng bất biến: sau tự phối, p = 0,60 + 0,10/2 = 0,65, đúng bằng p ban đầu như lí thuyết (tự phối không đổi tần số allele). Tổng 0,60 + 0,10 + 0,30 = 1.',
      ],
      answer:
        '(a) p(A) = 0,65; q(a) = 0,35. (b) Chưa cân bằng vì 0,0675 ≠ 0,04. (c) 0,4225 AA : 0,455 Aa : 0,1225 aa. (d) 0,60 AA : 0,10 Aa : 0,30 aa.',
    },
    checkQuestions: [
      {
        prompt:
          'Một đàn bò có 400 con: 100 con AA, 160 con Aa và 140 con aa (gene trên NST thường). Tính tần số allele a. Nhập số thập phân, ví dụ 0,25.',
        answer: { kind: 'numeric', value: 0.55, tolerance: { mode: 'absolute', eps: 0.001 } },
        explain:
          'Đếm bản sao allele chứ không đếm cá thể: số allele a = 2 × 140 + 160 = 440 trên tổng 2 × 400 = 800 bản sao, nên q = 440/800 = 0,55. ' +
          'Cách tương đương: q = z + y/2 = 0,35 + 0,40/2 = 0,55. Lỗi hay gặp là lấy 140/400 = 0,35 (chỉ đếm cá thể aa, bỏ quên allele a nằm trong cá thể dị hợp) hoặc chia cho N thay vì 2N.',
      },
      {
        prompt: 'Quần thể nào sau đây đang ở trạng thái cân bằng Hardy–Weinberg?',
        choices: [
          { id: 'cb_1', label: '0,50 AA : 0,40 Aa : 0,10 aa' },
          { id: 'cb_2', label: '0,64 AA : 0,32 Aa : 0,04 aa' },
          { id: 'cb_3', label: '0,36 AA : 0,16 Aa : 0,48 aa' },
          { id: 'cb_4', label: '0,25 AA : 0,25 Aa : 0,50 aa' },
        ],
        answer: { kind: 'choice', correctIds: ['cb_2'] },
        explain:
          'Dùng phép thử x·z = (y/2)²: chỉ quần thể 0,64 AA : 0,32 Aa : 0,04 aa thoả, vì 0,64 × 0,04 = 0,0256 = 0,16². ' +
          'Quần thể 0,50 : 0,40 : 0,10 trông gần giống nhưng 0,05 ≠ 0,04 — nó có p = 0,7 nên lẽ ra phải là 0,49 : 0,42 : 0,09. ' +
          'Bẫy: chỉ kiểm tổng bằng 1. Quần thể nào cũng có tổng bằng 1, điều đó không nói gì về cân bằng.',
      },
      {
        prompt:
          'Một quần thể cây tự thụ phấn bắt buộc có cấu trúc ban đầu 0,3 AA : 0,4 Aa : 0,3 aa. Sau 3 thế hệ tự thụ phấn, tần số kiểu gene AA là bao nhiêu? Nhập số thập phân.',
        answer: { kind: 'numeric', value: 0.475, tolerance: { mode: 'absolute', eps: 0.001 } },
        explain:
          'Dị hợp giảm một nửa mỗi thế hệ: Aa = 0,4/2³ = 0,05. Phần dị hợp mất đi là 0,4 − 0,05 = 0,35, chia đều cho hai bên đồng hợp nên mỗi bên được 0,175, vậy AA = 0,3 + 0,175 = 0,475. ' +
          'Lỗi hay gặp: dùng công thức [1 − (1/2)ⁿ]/2 của quần thể 100% Aa (ra 0,4375), hoặc tính đúng phần tăng 0,175 mà quên cộng 0,3 AA có sẵn từ đầu.',
      },
      {
        prompt:
          'Giả sử ở một quần thể người đang cân bằng di truyền, một bệnh do allele lặn trên NST X (không có allele trên Y) gặp ở 8% nam giới. Trong số nữ giới, tỉ lệ người không bị bệnh nhưng mang allele bệnh (dị hợp) là bao nhiêu? Nhập số thập phân làm tròn 4 chữ số sau dấu phẩy.',
        answer: { kind: 'numeric', value: 0.1472, tolerance: { mode: 'absolute', eps: 0.0001 } },
        explain:
          'Nam chỉ có một X nên tỉ lệ nam bị bệnh chính là q: q = 0,08 và p = 0,92. Nữ có hai X nên tỉ lệ dị hợp = 2pq = 2 × 0,92 × 0,08 = 0,1472. ' +
          'Bẫy hay gặp: khai căn 0,08 để tìm q (ra q ≈ 0,283) như với gene trên NST thường — ở nam không có bình phương nào để khai căn. ' +
          'Kiểm lại: nữ bị bệnh chỉ là q² = 0,0064, ít hơn nam 12,5 lần, đúng đặc điểm của bệnh lặn trên X.',
      },
    ],
    srsCards: [
      {
        hoi: 'Kiểm tra nhanh quần thể x AA + y Aa + z aa đã cân bằng Hardy–Weinberg chưa?',
        dap: 'Cân bằng khi x·z = (y/2)². Lí do: ở cân bằng x = p², z = q², y/2 = pq. Không suy q = √aa khi chưa biết quần thể cân bằng.',
      },
      {
        hoi: 'Tự phối làm thay đổi gì và giữ nguyên gì?',
        dap: 'Dị hợp giảm một nửa mỗi thế hệ, phần mất đi chia đều cho AA và aa; tần số allele giữ nguyên.',
      },
      {
        hoi: 'Bệnh lặn trên X có tần số allele bệnh q: tỉ lệ nam bệnh, nữ bệnh, nữ dị hợp?',
        dap: 'Nam bệnh = q; nữ bệnh = q²; nữ dị hợp = 2pq. Không khai căn tỉ lệ nam bị bệnh.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh12-c93-b2',
    grade: '12',
    chapterNumber: 93,
    chapterTitle: 'Chuyên đề HSG: Di truyền học',
    lessonNumber: 2,
    title: 'Suy tần số hoán vị gene từ tỉ lệ kiểu hình đời con',
    hook:
      'Một kĩ sư chọn giống lúa ở đồng bằng sông Cửu Long muốn có dòng vừa thấp cây vừa chịu mặn. Khổ nỗi hai gene đó nằm ' +
      'gần nhau trên cùng một NST, và ở cây bố mẹ, allele thấp cây lại đi chung với allele không chịu mặn. Lai phân tích ' +
      '1000 cây, chỉ khoảng 30 cây mang đúng tổ hợp cần tìm. Con số 30 không phải do xui: nó đo được khoảng cách giữa hai ' +
      'gene, và cho biết lần sau cần gieo bao nhiêu cây.',
    theory:
      '## Lai phân tích là máy đếm giao tử\n' +
      'Cơ thể đem lai phân tích dị hợp hai cặp gene, còn cây kia chỉ cho một loại giao tử ab. Vì thế mỗi kiểu hình đời con ' +
      'phản ánh ĐÚNG MỘT loại giao tử của cơ thể dị hợp, và tỉ lệ kiểu hình bằng tỉ lệ giao tử.\n' +
      '— 4 lớp tỉ lệ 1 : 1 : 1 : 1: hai gene phân li độc lập (hoặc nằm rất xa nhau trên cùng NST).\n' +
      '— 2 lớp tỉ lệ 1 : 1: liên kết hoàn toàn.\n' +
      '— 4 lớp, hai lớp LỚN bằng nhau và hai lớp NHỎ bằng nhau: liên kết không hoàn toàn, tức có hoán vị gene.\n\n' +
      '## Tần số hoán vị f và tỉ lệ giao tử\n' +
      '— f = tổng tỉ lệ các giao tử hoán vị = tổng tỉ lệ hai lớp kiểu hình NHỎ trong lai phân tích.\n' +
      '— Mỗi giao tử liên kết chiếm (1 − f)/2, mỗi giao tử hoán vị chiếm f/2.\n' +
      '— VÌ SAO f không vượt 50%: trao đổi chéo xảy ra ở kì đầu giảm phân I giữa HAI trong BỐN chromatid của cặp NST kép. ' +
      'Một tế bào có trao đổi chéo ở vùng giữa hai gene cho 2 giao tử hoán vị và 2 giao tử liên kết. Kể cả khi 100% tế bào ' +
      'đều trao đổi chéo, giao tử hoán vị cũng chỉ chiếm một nửa. Từ đó: f = (tỉ lệ tế bào có trao đổi chéo) / 2.\n\n' +
      '## Dị hợp đều hay dị hợp chéo\n' +
      'Hai loại giao tử chiếm tỉ lệ LỚN là giao tử liên kết; chúng cho biết allele nào nằm chung một NST ở cơ thể bố mẹ. ' +
      'Lớp lớn là AB và ab thì cơ thể là AB/ab (dị hợp đều); lớp lớn là Ab và aB thì cơ thể là Ab/aB (dị hợp chéo). ' +
      'Bẫy: mặc định mọi cơ thể dị hợp hai cặp đều là AB/ab.\n\n' +
      '## Bản đồ di truyền\n' +
      'Quy ước 1% hoán vị = 1 centiMorgan (cM). Hai gene càng xa nhau thì càng có nhiều chỗ để trao đổi chéo xảy ra giữa ' +
      'chúng, nên f càng lớn. Với ba gene, hai khoảng cách nhỏ cộng lại xấp xỉ bằng khoảng cách lớn nhất; gene không có mặt ' +
      'trong khoảng cách lớn nhất là gene nằm giữa. Khi hai gene ở rất xa, trao đổi chéo kép đưa allele về chỗ cũ và không ' +
      'được đếm, nên f đo được nhỏ hơn khoảng cách thật — vì thế người ta lập bản đồ bằng các đoạn ngắn rồi cộng lại.\n\n' +
      '## Khi không phải lai phân tích: đi vòng qua lớp aabb\n' +
      'Hai cơ thể dị hợp hai cặp gene giao phối (trội hoàn toàn): kiểu hình aabb chỉ tạo bởi giao tử ab gặp ab, nên ' +
      'aabb = ab(bố) × ab(mẹ). Nếu hai bên cùng kiểu gene và hoán vị cùng tần số thì ab = √(aabb).\n' +
      '— ab ≥ 0,25: ab là giao tử liên kết, cơ thể là AB/ab và ab = (1 − f)/2.\n' +
      '— ab < 0,25: ab là giao tử hoán vị, cơ thể là Ab/aB và ab = f/2.\n' +
      '— Có aabb rồi thì: A-B- = 0,5 + aabb; A-bb = aaB- = 0,25 − aabb. Lí do: mỗi bên đều Bb nên bb luôn chiếm 1/4, ' +
      'mà bb gồm A-bb và aabb.\n' +
      'BẪY: ở ruồi giấm, con đực không có hoán vị; ở tằm, con cái không có hoán vị. Khi đó aabb = ab(giới có hoán vị) × ' +
      'ab(giới không hoán vị) — không được khai căn.',
    workedExample: {
      problem:
        'Ở một loài cây, A (thân cao) trội hoàn toàn so với a (thân thấp); B (hoa đỏ) trội hoàn toàn so với b (hoa trắng). ' +
        'Cây F1 dị hợp hai cặp gene đem lai phân tích, thu được 1000 cây: 420 cao, trắng; 420 thấp, đỏ; 80 cao, đỏ; 80 thấp, trắng. ' +
        '(a) Xác định quy luật di truyền, kiểu gene F1 và tần số hoán vị. (b) Nếu cho F1 tự thụ phấn, hoán vị xảy ra ở cả ' +
        'hai giới với cùng tần số, tính tỉ lệ các kiểu hình ở đời con.',
      steps: [
        'Bước 1 — Đếm lớp: đời con có 4 lớp kiểu hình nhưng không theo tỉ lệ 1 : 1 : 1 : 1 mà là 420 : 420 : 80 : 80; hai lớp lớn bằng nhau, hai lớp nhỏ bằng nhau. Kết luận: hai gene cùng nằm trên một NST và có hoán vị.',
        'Bước 2 — Cây đem lai phân tích chỉ cho giao tử ab, nên mỗi kiểu hình đời con chính là một loại giao tử của F1: cao, trắng ứng với Ab; thấp, đỏ ứng với aB; cao, đỏ ứng với AB; thấp, trắng ứng với ab.',
        'Bước 3 — Tần số hoán vị bằng tổng hai lớp nhỏ: f = (80 + 80)/1000 = 0,16 = 16%. Tự kiểm: f < 50%, hợp lí.',
        'Bước 4 — Hai lớp lớn là Ab và aB, tức đó là hai giao tử liên kết: F1 có kiểu gene Ab/aB (dị hợp chéo). Đây là chỗ hay sai nhất nếu mặc định F1 là AB/ab. Khoảng cách giữa hai gene là 16 cM.',
        'Bước 5 — F1 tự thụ phấn, hoán vị cả hai giới với f = 16%: ab là giao tử hoán vị nên ab = f/2 = 0,08 ở mỗi bên. Vậy aabb = 0,08 × 0,08 = 0,0064.',
        'Bước 6 — Suy các lớp còn lại từ aabb: A-B- = 0,5 + 0,0064 = 0,5064; A-bb = aaB- = 0,25 − 0,0064 = 0,2436.',
        'Bước 7 — Tự kiểm: 0,5064 + 0,2436 + 0,2436 + 0,0064 = 1. Thêm nữa, aabb rất nhỏ là đúng bản chất: F1 dị hợp chéo nên muốn có giao tử ab thì phải nhờ hoán vị ở CẢ hai bên.',
      ],
      answer:
        '(a) Hoán vị gene; F1 là Ab/aB; f = 16% (khoảng cách 16 cM). (b) 0,5064 cao, đỏ : 0,2436 cao, trắng : 0,2436 thấp, đỏ : 0,0064 thấp, trắng.',
    },
    checkQuestions: [
      {
        prompt:
          'Lai phân tích một cây dị hợp hai cặp gene (A trội hoàn toàn so với a, B trội hoàn toàn so với b), đời con gồm 370 cây A-B-, 370 cây aabb, 130 cây A-bb và 130 cây aaB-. Tần số hoán vị gene là bao nhiêu phần trăm? Chỉ nhập con số, ví dụ nhập 12 nếu f = 12%.',
        answer: { kind: 'numeric', value: 26 },
        explain:
          'Hai lớp nhỏ ứng với hai giao tử hoán vị: f = (130 + 130)/1000 = 26%. Hai lớp lớn là AB và ab nên cây đem lai là AB/ab (dị hợp đều). ' +
          'Lỗi hay gặp: lấy tổng hai lớp LỚN (74%) — con số trên 50% đã tự báo là sai, vì f không bao giờ vượt 50%; hoặc chỉ lấy một lớp nhỏ (13%), quên rằng có hai loại giao tử hoán vị.',
      },
      {
        prompt:
          'Một cây có kiểu gene AB/ab, hoán vị xảy ra ở cả hai giới với tần số 18%. Cho cây này tự thụ phấn (A trội hoàn toàn so với a, B trội hoàn toàn so với b). Tỉ lệ kiểu hình A-bb ở đời con là bao nhiêu? Nhập số thập phân làm tròn 4 chữ số sau dấu phẩy.',
        answer: { kind: 'numeric', value: 0.0819, tolerance: { mode: 'absolute', eps: 0.0001 } },
        explain:
          'Cây AB/ab có ab là giao tử liên kết: ab = (1 − 0,18)/2 = 0,41. Vậy aabb = 0,41² = 0,1681, và A-bb = 0,25 − 0,1681 = 0,0819. ' +
          'Đi vòng qua aabb nhanh hơn liệt kê 16 ô tổ hợp. Lỗi hay gặp: lấy ab = f/2 = 0,09 (nhầm ab là giao tử hoán vị), hoặc chỉ tính A-bb = 0,09² từ cặp Ab × Ab mà bỏ sót tổ hợp Ab × ab.',
      },
      {
        prompt:
          'Hai cây F1 có cùng kiểu gene, đều dị hợp hai cặp gene cùng nằm trên một NST (trội hoàn toàn), giao phấn với nhau; hoán vị xảy ra ở cả hai giới với cùng tần số. Đời con có 4% cây mang kiểu hình lặn về cả hai tính trạng (aabb). Tần số hoán vị là bao nhiêu phần trăm? Chỉ nhập con số.',
        answer: { kind: 'numeric', value: 40 },
        explain:
          'aabb = ab × ab nên ab = √0,04 = 0,2. Vì 0,2 < 0,25, ab là giao tử HOÁN VỊ, F1 là Ab/aB và f/2 = 0,2, suy ra f = 40%. ' +
          'Bẫy: coi ab là giao tử liên kết rồi giải (1 − f)/2 = 0,2 ra f = 60% — vượt 50% nên vô lí. Chính phép so ab với 0,25 cho biết F1 dị hợp đều hay dị hợp chéo.',
      },
      {
        prompt:
          'Ba gene A, B, C cùng nằm trên một NST. Tần số hoán vị đo được: giữa A và B là 12%, giữa B và C là 7%, giữa A và C là 19%. Thứ tự các gene trên NST là gì?',
        choices: [
          { id: 'bd_1', label: 'A – C – B' },
          { id: 'bd_2', label: 'A – B – C' },
          { id: 'bd_3', label: 'B – A – C' },
          { id: 'bd_4', label: 'Không xác định được vì ba khoảng cách độc lập với nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['bd_2'] },
        explain:
          'Khoảng cách lớn nhất là A–C = 19 cM, và 12 + 7 = 19, nên B nằm giữa A và C: thứ tự A – B – C (viết ngược thành C – B – A vẫn là cùng một bản đồ). ' +
          'Lỗi hay gặp: xếp theo thứ tự chữ cái hoặc theo thứ tự đề cho mà không kiểm phép cộng khoảng cách. Ba khoảng cách không độc lập: chúng phải khớp nhau trên cùng một đường thẳng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Trong lai phân tích, tần số hoán vị f tính thế nào?',
        dap: 'f = tổng tỉ lệ hai lớp kiểu hình nhỏ (giao tử hoán vị). Mỗi giao tử liên kết chiếm (1 − f)/2, mỗi giao tử hoán vị chiếm f/2.',
      },
      {
        hoi: 'Vì sao tần số hoán vị không vượt quá 50%?',
        dap: 'Trao đổi chéo chỉ xảy ra giữa 2 trong 4 chromatid, nên kể cả khi 100% tế bào có trao đổi chéo thì giao tử hoán vị cũng chỉ chiếm một nửa.',
      },
      {
        hoi: 'Biết aabb ở đời con của hai cơ thể dị hợp hai cặp (hoán vị hai giới như nhau), làm sao biết dị hợp đều hay chéo?',
        dap: 'Tính ab = √aabb. Nếu ab ≥ 0,25 thì AB/ab (ab là giao tử liên kết); nếu ab < 0,25 thì Ab/aB (ab là giao tử hoán vị).',
      },
    ],
    animation: {
      title: 'Bốn loại giao tử của cơ thể AB/ab khi tần số hoán vị tăng dần',
      description:
        'Biểu đồ bốn cột là tỉ lệ bốn loại giao tử của cơ thể AB/ab. Hai cột bên trái là giao tử liên kết AB và ab, hai cột bên phải là giao tử hoán vị Ab và aB; một đường nét đứt đánh dấu mức 0,25. ' +
        'Lúc đầu tần số hoán vị bằng 0: chỉ có hai cột liên kết, mỗi cột cao tới 0,5, hai cột hoán vị gần như bằng 0. ' +
        'Khi tần số hoán vị tăng lên 20%, hai cột liên kết hạ xuống 0,4 còn hai cột hoán vị mọc lên 0,1. ' +
        'Khi tần số hoán vị đạt 50%, cả bốn cột cùng chạm vạch 0,25, giống hệt phân li độc lập. Từ đó thấy hai cột hoán vị không bao giờ vượt được hai cột liên kết, nên tần số hoán vị không vượt 50%.',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 12000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'lb-tieude',
          x: 230,
          y: 22,
          text: 'Cơ thể AB/ab: tỉ lệ giao tử khi f tăng từ 0 đến 50%',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'truc',
          x1: 40,
          y1: 190,
          x2: 440,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'vach-025',
          x1: 44,
          y1: 130,
          x2: 440,
          y2: 130,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'lb-05',
          x: 36,
          y: 74,
          text: '0,5',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-025',
          x: 36,
          y: 134,
          text: '0,25',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        // Cột cao 120 đơn vị = tỉ lệ 0,5; co giãn theo trục y quanh chân cột (origin) để cột
        // "mọc" từ trục hoành chứ không bị nhấc lên khỏi trục.
        {
          kind: 'rect',
          id: 'cot-AB',
          x: 60,
          y: 70,
          w: 60,
          h: 120,
          rx: 3,
          fill: 'primary',
          origin: [90, 190],
          keyframes: [
            { atMs: 0, scaleY: 1 },
            { atMs: 1500, scaleY: 1 },
            { atMs: 4500, scaleY: 0.8 },
            { atMs: 6500, scaleY: 0.8 },
            { atMs: 9500, scaleY: 0.5 },
            { atMs: 12000, scaleY: 0.5 },
          ],
        },
        {
          kind: 'rect',
          id: 'cot-ab',
          x: 150,
          y: 70,
          w: 60,
          h: 120,
          rx: 3,
          fill: 'primary',
          origin: [180, 190],
          keyframes: [
            { atMs: 0, scaleY: 1 },
            { atMs: 1500, scaleY: 1 },
            { atMs: 4500, scaleY: 0.8 },
            { atMs: 6500, scaleY: 0.8 },
            { atMs: 9500, scaleY: 0.5 },
            { atMs: 12000, scaleY: 0.5 },
          ],
        },
        {
          kind: 'rect',
          id: 'cot-Ab',
          x: 270,
          y: 70,
          w: 60,
          h: 120,
          rx: 3,
          fill: 'accent',
          origin: [300, 190],
          keyframes: [
            { atMs: 0, scaleY: 0.01 },
            { atMs: 1500, scaleY: 0.01 },
            { atMs: 4500, scaleY: 0.2 },
            { atMs: 6500, scaleY: 0.2 },
            { atMs: 9500, scaleY: 0.5 },
            { atMs: 12000, scaleY: 0.5 },
          ],
        },
        {
          kind: 'rect',
          id: 'cot-aB',
          x: 360,
          y: 70,
          w: 60,
          h: 120,
          rx: 3,
          fill: 'accent',
          origin: [390, 190],
          keyframes: [
            { atMs: 0, scaleY: 0.01 },
            { atMs: 1500, scaleY: 0.01 },
            { atMs: 4500, scaleY: 0.2 },
            { atMs: 6500, scaleY: 0.2 },
            { atMs: 9500, scaleY: 0.5 },
            { atMs: 12000, scaleY: 0.5 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-AB',
          x: 90,
          y: 207,
          text: 'AB',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-ab',
          x: 180,
          y: 207,
          text: 'ab',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-Ab',
          x: 300,
          y: 207,
          text: 'Ab',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-aB',
          x: 390,
          y: 207,
          text: 'aB',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-lienket',
          x: 135,
          y: 228,
          text: 'liên kết: (1 − f)/2 mỗi loại',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'lb-hoanvi',
          x: 345,
          y: 228,
          text: 'hoán vị: f/2 mỗi loại',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'f = 0%: liên kết hoàn toàn, chỉ có hai loại giao tử AB và ab, mỗi loại 0,5.',
        },
        {
          atMs: 1500,
          text: 'f tăng: mỗi giao tử hoán vị chiếm f/2, mỗi giao tử liên kết chỉ còn (1 − f)/2.',
        },
        {
          atMs: 4500,
          text: 'f = 20%: AB = ab = 0,4; Ab = aB = 0,1. Lai phân tích cho tỉ lệ 4 : 4 : 1 : 1.',
        },
        {
          atMs: 9500,
          text: 'f = 50%: bốn loại giao tử đều bằng 0,25, giống hệt phân li độc lập — f không thể vượt 50%.',
        },
      ],
    },
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh12-c93-b3',
    grade: '12',
    chapterNumber: 93,
    chapterTitle: 'Chuyên đề HSG: Di truyền học',
    lessonNumber: 3,
    title: 'Xác suất trong phả hệ kết hợp tần số quần thể',
    hook:
      'Chị Lan ở Thái Bình đi khám sức khoẻ tiền hôn nhân. Em trai chị mắc một bệnh di truyền hiếm do gene lặn, còn bố mẹ ' +
      'chị đều khoẻ. Họ hàng nhà chồng sắp cưới không ai mắc bệnh. Bác sĩ không nói "25%" hay "50%" mà tính ra nguy cơ con ' +
      'đầu lòng bị bệnh chưa tới 1%. Con số ấy đến từ đâu, và vì sao không được nhân bừa các xác suất với nhau?',
    theory:
      '## Bước 1 — Xác định quy luật bằng phép loại trừ\n' +
      '— Trội hay lặn: bố mẹ đều bình thường mà sinh con bị bệnh thì allele bệnh là LẶN (bố mẹ mang ẩn). Bố mẹ đều bị bệnh ' +
      'mà sinh con bình thường thì allele bệnh là TRỘI (bố mẹ đều dị hợp).\n' +
      '— NST thường hay NST X: với bệnh lặn, nếu có CON GÁI bị bệnh mà BỐ bình thường thì gene không thể nằm trên X (con gái ' +
      'bệnh phải nhận Xᵃ từ bố, khi đó bố cũng bị bệnh), nên gene nằm trên NST thường. Với bệnh trội, nếu BỐ bị bệnh mà có ' +
      'CON GÁI bình thường thì gene cũng không thể nằm trên X, vì bố truyền X của mình cho mọi con gái.\n' +
      '— Gene trên Y bị loại ngay khi có nữ bị bệnh. Không tìm được dấu hiệu loại trừ thì phải dựa vào dữ kiện đề cho, đừng đoán.\n\n' +
      '## Bước 2 — Người bình thường trong phả hệ: xác suất CÓ ĐIỀU KIỆN\n' +
      'Bố mẹ Aa × Aa sinh con 1/4 AA : 1/2 Aa : 1/4 aa. Nhưng nếu đã BIẾT người con đó bình thường thì trường hợp aa bị loại, ' +
      'phải chia lại trên phần còn lại: AA = 1/3, Aa = 2/3. Lỗi kinh điển là dùng 1/2 thay vì 2/3.\n\n' +
      '## Bước 3 — Người lấy từ quần thể cân bằng\n' +
      'Người ngoài phả hệ, bình thường, đến từ quần thể cân bằng có tần số allele bệnh q thì: P(Aa | bình thường) = ' +
      '2pq / (p² + 2pq) = 2q / (1 + q). Bẫy: dùng thẳng 2pq — quên rằng đã biết người đó không bị bệnh.\n\n' +
      '## Bước 4 — Ghép lại: khi nào được nhân\n' +
      '— Xác suất một con bị bệnh lặn = P(bố Aa) × P(mẹ Aa) × 1/4. Được nhân vì kiểu gene của bố và của mẹ là hai sự kiện ' +
      'ĐỘC LẬP (hai người không cùng huyết thống).\n' +
      '— Cách tương đương, gọn hơn khi chỉ hỏi một con: đổi mỗi người ra tỉ lệ giao tử. Người 1/3 AA : 2/3 Aa cho giao tử ' +
      'a = 2/3 × 1/2 = 1/3. Con bị bệnh = a(bố) × a(mẹ).\n\n' +
      '## LỖI NHÂN KHÔNG ĐỘC LẬP — chỗ mất điểm nhiều nhất ở đề thi quốc gia\n' +
      '— Hai con đều bị bệnh KHÔNG bằng (xác suất một con bị bệnh)². Hai đứa con dùng CHUNG một cặp bố mẹ; sự kiện "bố mẹ ' +
      'đều Aa" chỉ xảy ra một lần. Đúng phải là: P(bố Aa) × P(mẹ Aa) × (1/4)².\n' +
      '— Vì thế cách đổi ra giao tử chỉ dùng được cho MỘT con. Dùng nó cho hai con là ngầm coi mỗi đứa có một cặp bố mẹ ' +
      'riêng, được bốc lại từ đầu.\n' +
      '— Nếu đề cho "đứa đầu đã bị bệnh" thì bố mẹ CHẮC CHẮN là Aa: đứa thứ hai bị bệnh với xác suất đúng 1/4, không còn ' +
      'dính tới 2/3 hay 2q/(1 + q) nữa.\n\n' +
      '## Bệnh trên X: hai câu hỏi trông giống nhau\n' +
      '— "Xác suất sinh con trai bị bệnh" = P(sinh con trai) × P(bị bệnh | là con trai): đã nhân 1/2 cho giới tính.\n' +
      '— "Xác suất con trai của họ bị bệnh" = đã biết là con trai, không nhân 1/2.\n' +
      'Đọc sai một chữ là kết quả lệch đúng hai lần.',
    workedExample: {
      problem:
        'Ông I.1 và bà I.2 đều bình thường, sinh được con gái II.1 bị bệnh M và con trai II.2 bình thường. II.2 lấy vợ II.3 ' +
        'bình thường, người đến từ một quần thể đang cân bằng di truyền, trong đó cứ 100 người có 1 người bị bệnh M. ' +
        '(a) Xác định quy luật di truyền của bệnh M. (b) Tính xác suất con đầu lòng của II.2 và II.3 bị bệnh M. ' +
        '(c) Tính xác suất họ sinh hai con đều bị bệnh M. (d) Tính xác suất con đầu lòng của họ là con trai bình thường.',
      steps: [
        'Bước 1 — Quy luật: I.1 và I.2 bình thường mà sinh II.1 bị bệnh, nên bệnh do allele LẶN. II.1 là con gái bị bệnh trong khi bố I.1 bình thường, nên gene không thể nằm trên X. Kết luận: gene lặn trên NST thường.',
        'Bước 2 — I.1 và I.2 bình thường nhưng có con aa, nên cả hai đều là Aa. II.2 bình thường nên loại trường hợp aa: II.2 có 1/3 AA : 2/3 Aa.',
        'Bước 3 — Quần thể của II.3: q² = 1/100 nên q = 0,1 và p = 0,9. Vì II.3 bình thường: P(Aa) = 2pq/(p² + 2pq) = 0,18/0,99 = 2/11.',
        'Bước 4 — Một con bị bệnh: 2/3 × 2/11 × 1/4 = 1/33 ≈ 0,0303. Tự kiểm bằng cách đổi ra giao tử: II.2 cho a = 1/3, II.3 cho a = 1/11, và 1/3 × 1/11 = 1/33 — khớp.',
        'Bước 5 — Hai con đều bị bệnh: bố mẹ phải cùng là Aa, xác suất 2/3 × 2/11 = 4/33; sau đó hai lần sinh độc lập, mỗi lần 1/4: 4/33 × 1/16 = 1/132 ≈ 0,0076. Nếu bình phương 1/33 sẽ ra 1/1089, chỉ bằng khoảng 1/8 đáp số đúng — đó là lỗi nhân không độc lập.',
        'Bước 6 — Con đầu lòng là con trai bình thường: gene trên NST thường nên giới tính độc lập với bệnh: (1 − 1/33) × 1/2 = 16/33 ≈ 0,4848.',
      ],
      answer:
        '(a) Gene lặn trên NST thường. (b) 1/33 ≈ 0,0303. (c) 1/132 ≈ 0,0076. (d) 16/33 ≈ 0,4848.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong một phả hệ, bố và mẹ đều mắc bệnh N nhưng sinh được một con gái hoàn toàn bình thường. Kết luận nào chắc chắn đúng?',
        choices: [
          { id: 'ql_1', label: 'Bệnh do gene lặn trên NST thường' },
          { id: 'ql_2', label: 'Bệnh do gene trội trên NST thường' },
          { id: 'ql_3', label: 'Bệnh do gene trội trên NST X' },
          { id: 'ql_4', label: 'Bệnh do gene lặn trên NST X' },
        ],
        answer: { kind: 'choice', correctIds: ['ql_2'] },
        explain:
          'Bố mẹ cùng bị bệnh mà sinh con bình thường nghĩa là cả hai mang ẩn allele bình thường, tức bệnh do allele TRỘI (nếu bệnh lặn thì aa × aa chỉ sinh aa). ' +
          'Còn phân biệt NST thường với X: nếu gene trội trên X thì bố bị bệnh XᴬY truyền Xᴬ cho mọi con gái, con gái không thể bình thường. Vậy chỉ còn trội trên NST thường. ' +
          'Lỗi hay gặp: thấy chữ "con gái" liền nghĩ tới X mà không làm phép loại trừ.',
      },
      {
        prompt:
          'Bệnh máu khó đông do allele lặn trên NST X quy định (không có allele trên Y). Một phụ nữ bình thường có bố mẹ bình thường và một anh trai bị bệnh; chị lấy một người chồng bình thường. Xác suất đứa con đầu lòng của họ là CON TRAI BÌNH THƯỜNG là bao nhiêu? Nhập số thập phân.',
        answer: { kind: 'numeric', value: 0.375, tolerance: { mode: 'absolute', eps: 0.0001 } },
        explain:
          'Anh trai bị bệnh nhận Xᵃ từ mẹ, nên mẹ là XᴬXᵃ, bố là XᴬY. Người phụ nữ bình thường có 1/2 XᴬXᴬ : 1/2 XᴬXᵃ, cho giao tử Xᵃ = 1/4. ' +
          'Con trai nhận X từ mẹ: P(sinh con trai bị bệnh) = 1/2 × 1/4 = 1/8, nên P(sinh con trai bình thường) = 1/2 − 1/8 = 3/8 = 0,375. ' +
          'Bẫy: trả lời 3/4 — đó là xác suất "đã biết là con trai thì bình thường", chưa nhân 1/2 cho việc sinh ra con trai.',
      },
      {
        prompt:
          'Một người đàn ông bình thường có bố mẹ bình thường và một em gái bị bệnh P do gene lặn trên NST thường. Anh lấy một người vợ bình thường đến từ quần thể đang cân bằng di truyền, trong đó 4% dân số bị bệnh P. Xác suất con đầu lòng của họ bị bệnh P là bao nhiêu? Nhập số thập phân làm tròn 4 chữ số sau dấu phẩy.',
        answer: { kind: 'numeric', value: 0.0556, tolerance: { mode: 'absolute', eps: 0.0001 } },
        explain:
          'Người chồng bình thường, bố mẹ là Aa × Aa nên xác suất anh là Aa bằng 2/3. Người vợ: q² = 0,04 nên q = 0,2; P(Aa | bình thường) = 2q/(1 + q) = 0,4/1,2 = 1/3. ' +
          'Con bị bệnh = 2/3 × 1/3 × 1/4 = 1/18 ≈ 0,0556. Lỗi hay gặp: lấy vợ Aa = 2pq = 0,32 (quên điều kiện vợ bình thường) ra 0,0533, hoặc lấy chồng Aa = 1/2.',
      },
      {
        prompt:
          'Một người đàn ông bình thường có bố mẹ bình thường và một em gái bị bệnh P do gene lặn trên NST thường. Anh lấy một người vợ bình thường đến từ quần thể cân bằng có 4% dân số bị bệnh P. Xác suất họ sinh hai người con đầu lòng ĐỀU bị bệnh P là bao nhiêu? Nhập số thập phân làm tròn 4 chữ số sau dấu phẩy.',
        answer: { kind: 'numeric', value: 0.0139, tolerance: { mode: 'absolute', eps: 0.0001 } },
        explain:
          'Hai đứa con dùng chung một cặp bố mẹ, nên chỉ nhân xác suất "cả hai đều Aa" MỘT lần: 2/3 × 1/3 = 2/9. Sau đó mỗi lần sinh độc lập là 1/4: 2/9 × (1/4)² = 2/144 = 1/72 ≈ 0,0139. ' +
          'Bình phương 1/18 ra 1/324 ≈ 0,0031 là sai, vì làm vậy coi như mỗi đứa con có một cặp bố mẹ riêng được bốc lại từ đầu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Người bình thường có bố mẹ Aa × Aa thì xác suất mang allele bệnh là bao nhiêu?',
        dap: '2/3, không phải 1/2: đã biết người đó bình thường nên loại aa, chia lại trên 1/4 AA + 1/2 Aa.',
      },
      {
        hoi: 'Người bình thường lấy từ quần thể cân bằng (tần số allele bệnh q) có xác suất dị hợp bao nhiêu?',
        dap: '2pq/(p² + 2pq) = 2q/(1 + q) — không phải 2pq, vì đã biết người đó không bị bệnh.',
      },
      {
        hoi: 'Xác suất hai con đều bị bệnh lặn khi chưa chắc bố mẹ là Aa?',
        dap: 'P(bố Aa) × P(mẹ Aa) × (1/4)². Không bình phương xác suất một con bị bệnh, vì hai con dùng chung một cặp bố mẹ.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
