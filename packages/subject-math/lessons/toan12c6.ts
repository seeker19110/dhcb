// lessons/toan12c6.ts — Toán 12, Chương 6: Xác suất có điều kiện.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN12_C6_LESSONS: MathLesson[] = [
  {
    id: 'toan12-c6-b1',
    grade: '12',
    chapterNumber: 6,
    chapterTitle: 'Xác suất có điều kiện',
    lessonNumber: 1,
    title: 'Xác suất có điều kiện và công thức Bayes',
    hook:
      'Một xét nghiệm sàng lọc bệnh được quảng cáo là "chính xác 99%". Bạn xét nghiệm và nhận kết quả dương tính. ' +
      'Vậy khả năng bạn thật sự mắc bệnh là 99%? Với một căn bệnh hiếm, con số thật có khi chỉ khoảng 9%. Sự chênh ' +
      'lệch khổng lồ ấy không phải lỗi của xét nghiệm — nó là chỗ trực giác con người sai một cách hệ thống.',
    theory:
      'ĐỊNH NGHĨA\n' +
      'Xác suất của A với ĐIỀU KIỆN B đã xảy ra:\n' +
      'P(A|B) = P(A ∩ B) / P(B), với P(B) > 0.\n' +
      'Ý nghĩa: khi biết B đã xảy ra, không gian mẫu bị THU HẸP lại chỉ còn B. Ta không còn tính trên toàn bộ Ω nữa ' +
      'mà tính trên B — đó là lý do mẫu số đổi từ 1 (tức P(Ω)) thành P(B).\n\n' +
      'CÔNG THỨC NHÂN XÁC SUẤT\n' +
      'P(A ∩ B) = P(B)·P(A|B) = P(A)·P(B|A).\n' +
      'Hai biến cố ĐỘC LẬP khi P(A|B) = P(A), tức việc B xảy ra không làm thay đổi khả năng của A. Khi đó công thức ' +
      'rút gọn thành P(A ∩ B) = P(A)·P(B).\n' +
      'CẢNH BÁO: "độc lập" KHÁC "xung khắc". Hai biến cố xung khắc (không cùng xảy ra) thì P(A ∩ B) = 0, và nếu cả ' +
      'hai đều có xác suất dương thì chúng KHÔNG độc lập — biết A xảy ra là biết chắc B không xảy ra, tức thông tin ' +
      'về A ảnh hưởng mạnh tới B. Nhầm hai khái niệm này là lỗi phổ biến nhất của chương.\n\n' +
      'CÔNG THỨC XÁC SUẤT TOÀN PHẦN\n' +
      'Nếu B và B̄ chia đôi không gian mẫu thì:\n' +
      'P(A) = P(B)·P(A|B) + P(B̄)·P(A|B̄).\n' +
      'Đây là cách "gom" các nhánh của một sơ đồ cây: đi hết mọi con đường dẫn tới A rồi cộng lại.\n\n' +
      'CÔNG THỨC BAYES\n' +
      'P(B|A) = P(B)·P(A|B) / P(A), trong đó P(A) tính bằng công thức toàn phần.\n' +
      'Bayes làm đúng một việc: ĐẢO NGƯỢC chiều điều kiện. Biết P(dương tính | có bệnh) mà cần P(có bệnh | dương ' +
      'tính) thì dùng Bayes.\n\n' +
      'VÌ SAO TRỰC GIÁC SAI Ở BÀI XÉT NGHIỆM\n' +
      'Người ta lẫn lộn P(A|B) với P(B|A) — hai con số hoàn toàn khác nhau. "99% chính xác" nói về P(dương tính | có ' +
      'bệnh). Nhưng nếu bệnh rất hiếm, số người KHOẺ MẠNH bị dương tính giả (1% của một nhóm rất đông) có thể nhiều ' +
      'gấp nhiều lần số người bệnh dương tính thật (99% của một nhóm rất nhỏ). Xác suất nền P(B), gọi là XÁC SUẤT ' +
      'TIÊN NGHIỆM, mới là thứ quyết định kết quả — và đó chính là thứ trực giác hay bỏ quên.',
    animation: {
      title: 'Biết B xảy ra thì không gian mẫu co lại còn đúng B',
      description:
        'Hình chữ nhật lớn là không gian mẫu, diện tích của nó ứng với xác suất 1. Biến cố B chiếm nửa trái nên P(B) = 1/2. Biến cố A là hình chữ nhật nằm vắt ngang, chiếm 1/4 diện tích toàn bộ nên P(A) = 1/4; phần chung của A và B chiếm 3/16. Khi tin tức B đã xảy ra tới nơi, toàn bộ phần nằm ngoài B mờ đi và biến mất khỏi cuộc chơi: không gian mẫu co lại chỉ còn B. Lúc này A không còn được so với hình lớn nữa mà so với B, cho P(A | B) bằng 3/16 chia 1/2 bằng 3/8, lớn hơn hẳn P(A) = 1/4 ban đầu. Hình động phá nhầm lẫn cốt tử của chương: xác suất có điều kiện không phải một công thức mới, nó là xác suất cũ đo trên một không gian mẫu đã bị thu nhỏ, và mẫu số P(B) chính là diện tích của cái không gian mới ấy.',
      viewBoxWidth: 300,
      viewBoxHeight: 250,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'khong-gian',
          x: 30,
          y: 40,
          w: 240,
          h: 160,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-omega',
          x: 30,
          y: 32,
          text: 'Ω  (xác suất 1)',
          size: 13,
          fill: 'muted',
        },
        {
          kind: 'rect',
          id: 'bien-co-b',
          x: 30,
          y: 40,
          w: 120,
          h: 160,
          fill: 'primary',
          opacity: 0.18,
        },
        {
          kind: 'label',
          id: 'nhan-b',
          x: 62,
          y: 60,
          text: 'B: P(B) = 1/2',
          size: 13,
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'bien-co-a',
          x: 60,
          y: 80,
          w: 120,
          h: 80,
          stroke: 'accent',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 186,
          y: 96,
          text: 'A: P(A) = 1/4',
          size: 13,
          fill: 'accent',
        },
        {
          kind: 'rect',
          id: 'phan-chung',
          x: 60,
          y: 80,
          w: 90,
          h: 80,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1200,
              opacity: 0,
            },
            {
              atMs: 1700,
              opacity: 0.4,
            },
            {
              atMs: 7000,
              opacity: 0.4,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-chung',
          x: 105,
          y: 126,
          text: 'P(A ∩ B) = 3/16',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1700,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'rect',
          id: 'che-ngoai',
          x: 150,
          y: 40,
          w: 120,
          h: 160,
          fill: 'surface',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0.85,
            },
            {
              atMs: 7000,
              opacity: 0.85,
            },
          ],
        },
        {
          kind: 'label',
          id: 'loai-bo',
          x: 210,
          y: 180,
          text: 'phần ngoài B bị loại',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'rect',
          id: 'vien-b-moi',
          x: 30,
          y: 40,
          w: 120,
          h: 160,
          stroke: 'primary',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kg-moi',
          x: 90,
          y: 216,
          text: 'không gian mẫu mới = B',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 0,
            },
            {
              atMs: 5300,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'ket',
          x: 150,
          y: 240,
          text: 'P(A | B) = (3/16) : (1/2) = 3/8  >  P(A) = 1/4',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Hình lớn là Ω; B chiếm nửa trái nên P(B) = 1/2, A chiếm 1/4 hình lớn.',
        },
        {
          atMs: 2200,
          text: 'Phần giao A ∩ B chiếm 3/16 diện tích toàn bộ.',
        },
        {
          atMs: 4000,
          text: 'Nghe tin B đã xảy ra: mọi kết quả ngoài B bị loại khỏi cuộc chơi.',
        },
        {
          atMs: 5300,
          text: 'Không gian mẫu co lại còn đúng B — A phải đo lại trên nền mới này.',
        },
        {
          atMs: 6100,
          text: 'P(A|B) = P(A ∩ B)/P(B) = 3/8, cao hơn P(A) = 1/4: biết B làm A dễ xảy ra hơn.',
        },
      ],
    },
    workedExample: {
      problem:
        'Một bệnh có tỉ lệ mắc trong dân số là 1%. Xét nghiệm cho kết quả dương tính đúng 99% với người có bệnh, và ' +
        'cũng cho dương tính nhầm 10% với người không bệnh. Một người xét nghiệm ra dương tính. Tính xác suất người ' +
        'đó thật sự có bệnh.',
      steps: [
        'Bước 1 — Đặt tên biến cố cho rõ chiều điều kiện (bước quan trọng nhất, vì lẫn chiều là hỏng cả bài): gọi B ' +
          'là "có bệnh", A là "xét nghiệm dương tính". Đề cho P(B) = 0,01; P(A|B) = 0,99; P(A|B̄) = 0,10. Cần tìm ' +
          'P(B|A) — chiều NGƯỢC lại với dữ kiện, nên chắc chắn phải dùng Bayes.',
        'Bước 2 — Tính xác suất dương tính tổng thể bằng công thức toàn phần, vì có hai con đường dẫn tới dương ' +
          'tính: P(A) = P(B)·P(A|B) + P(B̄)·P(A|B̄) = 0,01·0,99 + 0,99·0,10.',
        'Bước 3 — Tính từng nhánh: 0,01·0,99 = 0,0099 (dương tính thật) và 0,99·0,10 = 0,099 (dương tính giả). Cộng ' +
          'lại P(A) = 0,1089. Nhận xét ngay ở đây: số ca dương tính GIẢ gấp 10 lần số ca dương tính THẬT, vì nhóm ' +
          'người khoẻ đông hơn hẳn.',
        'Bước 4 — Áp Bayes: P(B|A) = 0,0099 / 0,1089 ≈ 0,0909, tức khoảng 9,1%.',
        'Bước 5 — Diễn giải: dù xét nghiệm rất nhạy, một kết quả dương tính chỉ cho khoảng 9% khả năng thật sự mắc ' +
          'bệnh. Đó là lý do y học luôn làm xét nghiệm khẳng định lần hai thay vì kết luận ngay — và cũng là lý do ' +
          'không được sàng lọc đại trà một bệnh quá hiếm.',
      ],
      answer: 'Xác suất người đó thật sự có bệnh chỉ khoảng 9,1%.',
    },
    checkQuestions: [
      {
        prompt:
          'Gieo một con xúc xắc cân đối. Biết kết quả là số chẵn, tính xác suất để đó là số 6. ' +
          '(Nhập dạng phân số tối giản.)',
        answer: { kind: 'fraction', num: 1, den: 3 },
        explain:
          'Điều kiện "số chẵn" THU HẸP không gian mẫu từ {1;...;6} xuống còn {2; 4; 6} gồm 3 kết quả đồng khả năng. ' +
          'Trong đó chỉ một kết quả là số 6, nên xác suất bằng 1/3. Lỗi hay gặp là vẫn trả lời 1/6 vì quên rằng ' +
          'thông tin điều kiện đã loại bỏ ba khả năng lẻ. Kiểm bằng công thức: P(6 ∩ chẵn)/P(chẵn) = (1/6)/(1/2) = 1/3.',
      },
      {
        prompt:
          'Hai biến cố A và B đều có xác suất dương và XUNG KHẮC với nhau. Chúng có độc lập với nhau không? ' +
          'Nhập 1 nếu CÓ, 0 nếu KHÔNG.',
        answer: { kind: 'numeric', value: 0 },
        explain:
          'KHÔNG độc lập — và đây là bẫy khái niệm trọng tâm của chương. Xung khắc nghĩa là P(A ∩ B) = 0. Nếu chúng ' +
          'độc lập thì phải có P(A ∩ B) = P(A)·P(B) > 0 (vì cả hai xác suất đều dương), mâu thuẫn. Hiểu theo trực ' +
          'giác: biết A đã xảy ra là biết CHẮC CHẮN B không xảy ra, tức P(B|A) = 0 khác hẳn P(B) — thông tin về A ' +
          'ảnh hưởng tối đa tới B, đó là phụ thuộc mạnh nhất có thể chứ không phải độc lập.',
      },
      {
        prompt:
          'Một hộp có 3 bi đỏ và 2 bi xanh. Lấy lần lượt 2 bi KHÔNG hoàn lại. Tính xác suất cả hai bi đều đỏ. ' +
          '(Nhập dạng phân số tối giản.)',
        answer: { kind: 'fraction', num: 3, den: 10 },
        explain:
          'Dùng công thức nhân: P(đỏ lần 1) = 3/5. Sau khi đã lấy một bi đỏ ra, hộp chỉ còn 4 bi trong đó 2 đỏ, nên ' +
          'P(đỏ lần 2 | đỏ lần 1) = 2/4 = 1/2. Nhân lại: 3/5 · 1/2 = 3/10. Lỗi phổ biến là dùng 3/5 · 3/5 = 9/25, ' +
          'tức coi hai lần lấy là độc lập — chỉ đúng khi có HOÀN LẠI. Lấy không hoàn lại thì lần đầu làm thay đổi ' +
          'thành phần của hộp, nên bắt buộc phải dùng xác suất có điều kiện.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức xác suất có điều kiện và ý nghĩa của mẫu số?',
        dap: 'P(A|B) = P(A∩B)/P(B); mẫu là P(B) vì không gian mẫu đã thu hẹp lại còn B.',
      },
      {
        hoi: 'Phân biệt "độc lập" và "xung khắc"?',
        dap: 'Xung khắc: P(A∩B) = 0. Độc lập: P(A∩B) = P(A)P(B). Hai biến cố xung khắc có xác suất dương thì KHÔNG độc lập.',
      },
      {
        hoi: 'Công thức Bayes dùng để làm gì?',
        dap: 'Đảo chiều điều kiện: từ P(A|B) suy ra P(B|A), với mẫu số tính bằng công thức xác suất toàn phần.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan12-c6-b2',
    grade: '12',
    chapterNumber: 6,
    chapterTitle: 'Xác suất có điều kiện',
    lessonNumber: 2,
    title: 'Công thức xác suất toàn phần và bài toán xét nghiệm',
    hook:
      'Một lô xoài ở chợ đầu mối được gom từ ba nhà vườn với số lượng khác nhau, và mỗi vườn có tỉ lệ quả hỏng ' +
      'khác nhau. Lấy ngẫu nhiên một quả: khả năng nó hỏng là bao nhiêu? Câu hỏi này không thể trả lời bằng một ' +
      'phép nhân đơn lẻ, vì quả đó có thể đến từ bất kì vườn nào. Ta cần cách gom ba khả năng lại thành một ' +
      'con số — và cũng chính cách ấy lý giải vì sao kết quả xét nghiệm dương tính nhiều khi không đáng sợ như ta nghĩ.',
    theory:
      'HỆ BIẾN CỐ ĐẦY ĐỦ\n' +
      'Các biến cố B₁, B₂, ..., Bₖ lập thành một hệ đầy đủ nếu chúng ĐÔI MỘT XUNG KHẮC và hợp lại là toàn bộ không ' +
      'gian mẫu, nghĩa là mỗi kết quả rơi vào ĐÚNG MỘT ngăn. Ví dụ ba nhà vườn của lô xoài, hay cặp B và B̄ ' +
      '("có bệnh" và "không bệnh"). Kiểm nhanh: P(B₁) + ... + P(Bₖ) = 1.\n\n' +
      'CÔNG THỨC XÁC SUẤT TOÀN PHẦN\n' +
      'P(A) = P(B₁)·P(A|B₁) + P(B₂)·P(A|B₂) + ... + P(Bₖ)·P(A|Bₖ).\n' +
      'VÌ SAO ĐÚNG: biến cố A bị các ngăn Bᵢ cắt thành những mảnh A∩Bᵢ không chồng lên nhau, cộng các mảnh ' +
      'lại ra A. Mỗi mảnh có xác suất P(A∩Bᵢ) = P(Bᵢ)·P(A|Bᵢ) theo công thức nhân.\n' +
      'HAI LỖI HAY GẶP: (1) dùng khi các Bᵢ chưa đầy đủ, nên tổng bị hụt, hoặc bị chồng lấn nên đếm hai lần; ' +
      '(2) nghĩ rằng các P(A|Bᵢ) phải cộng lại bằng 1. Không cần: chúng là các xác suất ở những "thế giới" khác ' +
      'nhau. Chỉ các P(Bᵢ) mới cộng lại bằng 1 (và với cùng một Bᵢ thì P(A|Bᵢ) + P(Ā|Bᵢ) = 1).\n\n' +
      'SƠ ĐỒ CÂY HAI TẦNG\n' +
      'Tầng 1 chia theo hệ đầy đủ Bᵢ, ghi P(Bᵢ) trên nhánh. Tầng 2 từ mỗi Bᵢ chia tiếp thành A và Ā, ghi xác suất CÓ ' +
      'ĐIỀU KIỆN P(A|Bᵢ). Quy tắc đọc: NHÂN dọc theo từng đường đi, CỘNG các đường cùng dẫn tới A. Hai phép kiểm: ' +
      'các nhánh ra từ cùng một nút cộng lại bằng 1; tổng xác suất của mọi lá bằng 1.\n\n' +
      'BÀI TOÁN XÉT NGHIỆM VÀ KIỂM TRA SẢN PHẨM\n' +
      'Hai khái niệm phải tách bạch, vì quảng cáo thường chỉ nói một trong hai:\n' +
      '— ĐỘ NHẠY = P(dương tính | có bệnh): bắt được bao nhiêu phần người bệnh.\n' +
      '— ĐỘ ĐẶC HIỆU = P(âm tính | không bệnh): nhận ra đúng bao nhiêu phần người khoẻ. Từ đó ' +
      'P(dương tính | không bệnh) = 1 − độ đặc hiệu, tức tỉ lệ DƯƠNG TÍNH GIẢ.\n' +
      'Với p là tỉ lệ bệnh trong nhóm được xét (xác suất nền), xác suất có bệnh khi dương tính là\n' +
      'P(bệnh | dương) = nhạy·p / [nhạy·p + (1 − đặc hiệu)(1 − p)].\n\n' +
      'VÌ SAO BỆNH HIẾM THÌ DƯƠNG TÍNH GIẢ NHIỀU\n' +
      'Mẫu số có hai phần: dương tính THẬT tỉ lệ với p, dương tính GIẢ tỉ lệ với (1 − p). Khi p rất nhỏ thì ' +
      '(1 − p) gần 1, nên số dương tính giả xấp xỉ (1 − đặc hiệu) nhân với CẢ nhóm đông, còn số dương tính ' +
      'thật chỉ là nhạy nhân với nhóm bệnh bé tí. Dù xét nghiệm rất tốt, 5% của một nhóm khổng lồ vẫn lớn hơn ' +
      '90% của một nhóm nhỏ xíu. Cách thấy rõ nhất là ĐẾM NGƯỜI thay vì nhân phân số: giả sử 100 000 người ' +
      'rồi chia từng tầng (gọi là biểu diễn bằng tần số tự nhiên).\n' +
      'Điều ngược lại cũng đúng: với bệnh hiếm, kết quả ÂM TÍNH thường rất đáng tin vì hầu hết người âm tính là người ' +
      'khoẻ.\n\n' +
      'XÉT NGHIỆM LẦN HAI\n' +
      'Sau một lần dương tính, xác suất có bệnh của người đó không còn là p mà là P(bệnh | dương). Con số ấy trở ' +
      'thành xác suất NỀN MỚI cho lần xét nghiệm tiếp theo (với giả thiết hai lần độc lập khi đã biết tình trạng ' +
      'bệnh). Vì vậy xét nghiệm khẳng định làm niềm tin tăng vọt, và đó là lý do y học không kết luận dựa trên một ' +
      'lần sàng lọc. Lưu ý giả thiết độc lập là một đơn giản hoá: lỗi của hai lần đo có thể cùng nguyên nhân.',
    animation: {
      title: 'Bệnh hiếm: dương tính giả đông hơn dương tính thật',
      description:
        'Trong 100 000 người, tỉ lệ bệnh 0,5%, độ nhạy 90%, độ đặc hiệu 95%. Hai thanh ngang cùng thang đo. Thanh ' +
        'xanh là 450 người bệnh dương tính thật, rất ngắn. Thanh đỏ là 4 975 người khoẻ bị dương tính giả, dài ' +
        'gấp hơn 11 lần. Trong tổng 5 425 người dương tính chỉ có 450 người thật sự bệnh, tức khoảng 8,3%.',
      viewBoxWidth: 380,
      viewBoxHeight: 220,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'nhanTieuDe',
          x: 190,
          y: 24,
          text: '100 000 người: bệnh 0,5%, nhạy 90%, đặc hiệu 95%',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhanThat',
          x: 40,
          y: 64,
          text: 'Dương tính thật: 450 người',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 800, opacity: 0 },
            { atMs: 1200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'thanhThat',
          x: 40,
          y: 72,
          w: 27,
          h: 26,
          fill: 'correct',
          origin: [40, 85],
          keyframes: [
            { atMs: 0, scaleX: 0.01 },
            { atMs: 1200, scaleX: 0.01 },
            { atMs: 2400, scaleX: 1 },
            { atMs: 7000, scaleX: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanGia',
          x: 40,
          y: 124,
          text: 'Dương tính giả: 4 975 người',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2800, opacity: 0 },
            { atMs: 3200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'thanhGia',
          x: 40,
          y: 132,
          w: 298.5,
          h: 26,
          fill: 'danger',
          origin: [40, 145],
          keyframes: [
            { atMs: 0, scaleX: 0.01 },
            { atMs: 3200, scaleX: 0.01 },
            { atMs: 4600, scaleX: 1 },
            { atMs: 7000, scaleX: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanKetLuan',
          x: 190,
          y: 196,
          text: 'Xác suất bệnh = 450 / (450 + 4 975) ≈ 8,3%',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5600, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Chia 100 000 người: 500 người bệnh, 99 500 người khoẻ.' },
        { atMs: 1200, text: 'Độ nhạy 90%: 450 người bệnh cho kết quả dương tính thật.' },
        { atMs: 3200, text: 'Dương tính giả 5% của 99 500 người khoẻ: 4 975 người.' },
        { atMs: 5600, text: 'Trong 5 425 người dương tính, chỉ 450 người thật sự bệnh.' },
      ],
    },
    workedExample: {
      problem:
        'Một bệnh có tỉ lệ mắc 0,5% trong nhóm người được sàng lọc. Xét nghiệm có độ nhạy 90% và độ đặc hiệu 95%. ' +
        'Một người có kết quả dương tính. Tính xác suất người đó thật sự mắc bệnh, và xác suất người có kết quả âm ' +
        'tính thật sự không bệnh.',
      steps: [
        'Bước 1 — Dịch đề sang kí hiệu, tách rõ nhạy và đặc hiệu (nhầm hai khái niệm là lỗi phổ biến nhất): B là ' +
          '"mắc bệnh", A là "dương tính". P(B) = 0,005; độ nhạy P(A|B) = 0,90; độ đặc hiệu P(Ā|B̄) = 0,95 nên ' +
          'tỉ lệ dương tính giả P(A|B̄) = 0,05. Cần tìm P(B|A).',
        'Bước 2 — Chọn cách ĐẾM NGƯỜI để tránh nhầm chiều điều kiện: xét 100 000 người, gồm 500 người bệnh ' +
          '(0,5%) và 99 500 người khoẻ. Đây là tầng 1 của sơ đồ cây, chia theo hệ đầy đủ {B, B̄}.',
        'Bước 3 — Tầng 2: dương tính thật = 90% của 500 = 450 người; dương tính giả = 5% của 99 500 = 4 975 ' +
          'người. Tổng dương tính = 450 + 4 975 = 5 425 người, và đó chính là kết quả của công thức xác suất toàn ' +
          'phần P(A) = 5 425/100 000 = 0,05425.',
        'Bước 4 — Áp Bayes: P(B|A) = 450/5 425 ≈ 0,0829, tức khoảng 8,3%. Kiểm bằng công thức: ' +
          '0,005·0,9 / (0,005·0,9 + 0,995·0,05) = 0,0045/0,05425, cùng giá trị.',
        'Bước 5 — Phần âm tính: người khoẻ âm tính = 99 500 − 4 975 = 94 525; người bệnh âm tính = 500 − 450 = ' +
          '50. Xác suất không bệnh khi âm tính = 94 525/94 575 ≈ 99,95%. Vậy dương tính chỉ là tín hiệu để xét ' +
          'nghiệm tiếp, còn âm tính thì rất đáng tin trong trường hợp bệnh hiếm này.',
      ],
      answer:
        'Khi dương tính, xác suất mắc bệnh chỉ khoảng 8,3% (450/5 425); khi âm tính, xác suất không bệnh khoảng 99,95%.',
    },
    checkQuestions: [
      {
        prompt:
          'Lô xoài gồm ba vườn: vườn A chiếm 50% số quả, tỉ lệ hỏng 2%; vườn B chiếm 30%, tỉ lệ hỏng 3%; vườn C chiếm ' +
          '20%, tỉ lệ hỏng 5%. Lấy ngẫu nhiên một quả, xác suất quả đó hỏng là bao nhiêu? (Nhập số thập phân.)',
        answer: { kind: 'numeric', value: 0.029, tolerance: { mode: 'absolute', eps: 0.0005 } },
        explain:
          'Ba vườn lập thành hệ đầy đủ (50% + 30% + 20% = 100%). Công thức toàn phần: ' +
          '0,5·0,02 + 0,3·0,03 + 0,2·0,05 = 0,010 + 0,009 + 0,010 = 0,029. Lỗi hay gặp là lấy trung bình cộng đơn ' +
          'giản của ba tỉ lệ hỏng (cho 0,0333) mà quên trọng số theo tỉ phần của mỗi vườn.',
      },
      {
        prompt:
          'Một máy kiểm tra sản phẩm: 2% sản phẩm bị lỗi. Máy báo "lỗi" đúng với 96% sản phẩm lỗi, và báo nhầm với 4% ' +
          'sản phẩm tốt. Một sản phẩm bị máy báo "lỗi". Xác suất nó thật sự lỗi là bao nhiêu? ' +
          '(Làm tròn đến 3 chữ số thập phân.)',
        answer: { kind: 'numeric', value: 0.329, tolerance: { mode: 'absolute', eps: 0.001 } },
        explain:
          'Tử số: 0,02·0,96 = 0,0192 (báo lỗi đúng). Mẫu số, theo xác suất toàn phần: 0,0192 + 0,98·0,04 = ' +
          '0,0192 + 0,0392 = 0,0584. Kết quả 0,0192/0,0584 ≈ 0,329, nghĩa là chưa tới một phần ba sản phẩm bị báo ' +
          'lỗi là lỗi thật. Lỗi hay gặp là trả lời 0,96 do lẫn P(báo lỗi | lỗi) với P(lỗi | báo lỗi).',
      },
      {
        prompt:
          'Giữ nguyên độ nhạy 90% và độ đặc hiệu 95%. Nếu xét nghiệm cho nhóm nguy cơ cao, trong đó tỉ lệ mắc bệnh là ' +
          '20% thay vì 0,5%, thì xác suất mắc bệnh khi dương tính sẽ thay đổi thế nào?',
        choices: [
          { id: 'a', label: 'Giảm xuống, vì nhóm đông người bệnh hơn nên dễ nhầm hơn.' },
          { id: 'b', label: 'Tăng lên rất nhiều.' },
          { id: 'c', label: 'Không đổi, vì chất lượng xét nghiệm vẫn như cũ.' },
          { id: 'd', label: 'Luôn bằng đúng 90%, là độ nhạy.' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Xác suất nền p nằm trong công thức: với p = 0,2, ta có 0,2·0,9 = 0,18 dương tính thật so với ' +
          '0,8·0,05 = 0,04 dương tính giả, nên xác suất bệnh khi dương tính là 0,18/0,22 ≈ 81,8%, so với khoảng ' +
          '8,3% ở nhóm 0,5%. Phương án c là sai lầm kinh điển: độ nhạy và độ đặc hiệu là thuộc tính của xét ' +
          'nghiệm, nhưng ý nghĩa của một kết quả dương tính còn phụ thuộc vào xác suất nền của nhóm được xét.',
      },
      {
        prompt:
          'Dùng xét nghiệm trong ví dụ (bệnh 0,5%, nhạy 90%, đặc hiệu 95%). Một người xét nghiệm HAI LẦN ĐỘC LẬP ' +
          'và cả hai lần đều dương tính. Xác suất người đó mắc bệnh là bao nhiêu? (Làm tròn đến 3 chữ số thập phân.)',
        answer: { kind: 'numeric', value: 0.62, tolerance: { mode: 'absolute', eps: 0.001 } },
        explain:
          'Hai lần độc lập (khi biết tình trạng bệnh) nên bệnh: 0,9² = 0,81; không bệnh: 0,05² = 0,0025. ' +
          'Tử số 0,005·0,81 = 0,00405; mẫu số 0,00405 + 0,995·0,0025 = 0,00405 + 0,0024875 = 0,0065375. ' +
          'Kết quả 0,00405/0,0065375 ≈ 0,6195, làm tròn 0,620. Lỗi hay gặp là cộng hai kết quả dương tính ' +
          'như thể xác suất 8,3% + 8,3%; đúng ra phải cập nhật xác suất nền sau lần đầu rồi mới dùng cho lần hai.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức xác suất toàn phần với hệ đầy đủ B₁, ..., Bₖ, và điều kiện dùng?',
        dap: 'P(A) = ΣP(Bᵢ)·P(A|Bᵢ). Các Bᵢ phải đôi một xung khắc và hợp lại là cả không gian mẫu (ΣP(Bᵢ) = 1).',
      },
      {
        hoi: 'Phân biệt độ nhạy và độ đặc hiệu của xét nghiệm?',
        dap: 'Nhạy = P(dương | có bệnh). Đặc hiệu = P(âm | không bệnh); dương tính giả = 1 − đặc hiệu.',
      },
      {
        hoi: 'Vì sao với bệnh hiếm, kết quả dương tính vẫn có thể chỉ cho xác suất bệnh thấp?',
        dap: 'Dương tính giả lấy từ nhóm khoẻ rất đông nên nhiều hơn dương tính thật lấy từ nhóm bệnh rất nhỏ; xác suất nền p quyết định.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
