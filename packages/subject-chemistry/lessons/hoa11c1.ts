// lessons/hoa11c1.ts — Hoá học 11, Chương 1: Cân bằng hoá học (3 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/11/page_0004.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA11_C1_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c1-b1',
    grade: '11',
    chapterNumber: 1,
    chapterTitle: 'Cân bằng hoá học',
    lessonNumber: 1,
    title: 'Khái niệm về cân bằng hoá học',
    hook:
      'Hầu hết các phản ứng trong công nghiệp không xảy ra hoàn toàn đến cùng. Chúng dừng lại ở ' +
      'một trạng thái mà cả chất tham gia và sản phẩm cùng tồn tại song song — đó là trạng thái cân bằng.',
    theory:
      'PHẢN ỨNG MỘT CHIỀU VÀ PHẢN ỨNG THUẬN NGHỊCH:\n' +
      '— Phản ứng một chiều: phản ứng chỉ xảy ra theo một chiều từ chất tham gia tạo thành sản phẩm (dùng mũi tên đơn →).\n' +
      '— Phản ứng thuận nghịch: trong cùng điều kiện, phản ứng xảy ra theo cả hai chiều trái ngược nhau: chiều thuận (chất đầu → sản phẩm) và chiều nghịch (sản phẩm → chất đầu) (dùng mũi tên hai chiều ⇌).\n\n' +
      'TRẠNG THÁI CÂN BẰNG HOÁ HỌC:\n' +
      '— Trạng thái cân bằng của phản ứng thuận nghịch là trạng thái tại đó tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch (vt = vn).\n' +
      '— Đây là CÂN BẰNG ĐỘNG: phản ứng thuận và nghịch vẫn tiếp tục xảy ra với tốc độ bằng nhau, nồng độ của các chất trong hệ không thay đổi nữa.\n\n' +
      'HẰNG SỐ CÂN BẰNG (Kc):\n' +
      '— Đối với phản ứng thuận nghịch tổng quát ở trạng thái khí hoặc dung dịch: aA + bB ⇌ cC + dD.\n' +
      '— Biểu thức hằng số cân bằng: Kc = ([C]^c * [D]^d) / ([A]^a * [B]^b). Trong đó [A], [B], [C], [D] là nồng độ mol/L của các chất ở trạng thái cân bằng. Chất rắn không xuất hiện trong biểu thức Kc.\n\n' +
      'NGUYÊN LÍ CHUYỂN DỊCH CÂN BẰNG LE CHATELIER:\n' +
      '— Phát biểu: Một phản ứng thuận nghịch đang ở trạng thái cân bằng, khi chịu một tác động từ bên ngoài (như biến đổi nồng độ, nhiệt độ, áp suất), cân bằng sẽ chuyển dịch theo chiều làm GIẢM tác động đó.\n' +
      '— Nhiệt độ: Tăng nhiệt độ làm cân bằng dịch chuyển theo chiều thu nhiệt (ΔH > 0), giảm nhiệt độ dịch chuyển theo chiều toả nhiệt (ΔH < 0).\n' +
      '— Áp suất: Tăng áp suất chung của hệ làm cân bằng dịch chuyển theo chiều làm giảm số phân tử khí (chiều có tổng hệ số khí nhỏ hơn), giảm áp suất dịch chuyển theo chiều tăng số phân tử khí. Nếu số phân tử khí ở hai vế bằng nhau, áp suất không ảnh hưởng.\n' +
      '— Nồng độ: Tăng nồng độ một chất làm cân bằng dịch chuyển theo chiều làm giảm nồng độ chất đó (tiêu thụ chất đó).',
    workedExample: {
      problem:
        'Cho phản ứng thuận nghịch ở trạng thái cân bằng: N₂(g) + 3H₂(g) ⇌ 2NH₃(g). ' +
        'Biết nồng độ cân bằng của các chất là [N₂] = 0,01 M, [H₂] = 2,0 M, [NH₃] = 0,4 M. ' +
        'Tính hằng số cân bằng Kc của phản ứng ở nhiệt độ này.',
      steps: [
        'Viết biểu thức hằng số cân bằng Kc cho phản ứng: Kc = [NH₃]² / ([N₂] * [H₂]³).',
        'Thay các giá trị nồng độ cân bằng vào biểu thức: Kc = 0,4² / (0,01 * 2,0³).',
        'Tính toán giá trị: tử số = 0,4² = 0,16; mẫu số = 0,01 * 8 = 0,08.',
        'Kết quả: Kc = 0,16 / 0,08 = 2,0.',
      ],
      answer: 'Kc = 2',
    },
    checkQuestions: [
      {
        prompt:
          'Ở trạng thái cân bằng hoá học, tốc độ phản ứng thuận (vt) và tốc độ phản ứng nghịch (vn) có mối quan hệ như thế nào?',
        choices: [
          { id: 'bang', label: 'vt = vn (bằng nhau)' },
          { id: 'lon', label: 'vt > vn (thuận lớn hơn)' },
          { id: 'nho', label: 'vt < vn (thuận nhỏ hơn)' },
          { id: 'triet', label: 'Cả hai tốc độ đều bằng 0' },
        ],
        answer: { kind: 'choice', correctIds: ['bang'] },
        explain:
          'Cân bằng hoá học là trạng thái tại đó tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch (vt = vn).',
      },
      {
        prompt:
          'Cho phản ứng toả nhiệt: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH < 0). ' +
          'Khi tăng nhiệt độ của hệ, cân bằng sẽ dịch chuyển theo chiều nào?',
        choices: [
          { id: 'thuan', label: 'Chiều thuận' },
          { id: 'nghich', label: 'Chiều nghịch' },
          { id: 'khong', label: 'Không dịch chuyển' },
        ],
        answer: { kind: 'choice', correctIds: ['nghich'] },
        explain:
          'Theo nguyên lí Le Chatelier, khi tăng nhiệt độ, cân bằng dịch chuyển theo chiều thu nhiệt (ΔH > 0). Vì chiều thuận toả nhiệt (ΔH < 0) nên chiều nghịch là chiều thu nhiệt. Do đó cân bằng dịch chuyển theo chiều nghịch.',
      },
      {
        // Câu BẪY: "cứ tăng áp suất là cân bằng dịch chuyển" — quên kiểm SỐ MOL KHÍ hai vế.
        prompt:
          'Cho cân bằng H₂(g) + I₂(g) ⇌ 2HI(g). Khi tăng áp suất chung của hệ (giữ nguyên nhiệt ' +
          'độ), cân bằng dịch chuyển theo chiều nào?',
        choices: [
          { id: 'thuan', label: 'Chiều thuận (tạo thêm HI)' },
          { id: 'nghich', label: 'Chiều nghịch' },
          { id: 'khong', label: 'Không dịch chuyển' },
        ],
        answer: { kind: 'choice', correctIds: ['khong'] },
        explain:
          'Bẫy ở phản xạ "tăng áp suất thì cân bằng phải dịch chuyển". Phải ĐẾM số mol khí hai ' +
          'vế trước: vế trái có 1 + 1 = 2 mol khí, vế phải cũng có 2 mol khí. Không vế nào làm ' +
          'giảm được áp suất nhiều hơn vế nào, nên áp suất không ảnh hưởng tới vị trí cân bằng ' +
          'này. Áp suất chỉ có tác dụng khi tổng hệ số của CHẤT KHÍ ở hai vế khác nhau (ví dụ ' +
          'N₂ + 3H₂ ⇌ 2NH₃: 4 mol khí so với 2 mol khí).',
      },
    ],
    srsCards: [
      {
        hoi: 'Cân bằng hoá học là gì?',
        dap: 'Là trạng thái của phản ứng thuận nghịch khi tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch (vt = vn).',
      },
      {
        hoi: 'Tại sao cân bằng hoá học gọi là cân bằng động?',
        dap: 'Vì các phản ứng thuận và nghịch vẫn tiếp tục xảy ra với tốc độ bằng nhau, không dừng lại.',
      },
      {
        hoi: 'Nguyên lí Le Chatelier phát biểu thế nào?',
        dap: 'Cân bằng dịch chuyển theo chiều chống lại tác động bên ngoài (nhiệt độ, nồng độ, áp suất) để làm giảm tác động đó.',
      },
    ],
    animation: {
      title: 'Cân bằng chuyển dịch khi tăng nồng độ chất đầu (N₂ + 3H₂ ⇌ 2NH₃)',
      description:
        'Hình dùng hình ảnh chiếc cân đòn: đĩa trái là các chất đầu N₂ và H₂, đĩa phải là sản ' +
        'phẩm NH₃. Lúc đầu đòn cân nằm ngang — hệ đang ở trạng thái cân bằng, tốc độ phản ứng ' +
        'thuận bằng tốc độ phản ứng nghịch. Sau đó ta bơm thêm N₂ vào, đĩa trái nặng xuống: hệ ' +
        'bị lệch khỏi cân bằng. Phản ứng theo CHIỀU THUẬN chạy mạnh hơn để tiêu thụ bớt lượng ' +
        'N₂ vừa thêm, nên đòn cân dần trở lại ngang ở một vị trí cân bằng mới có nhiều NH₃ hơn. ' +
        'Đúng tinh thần nguyên lí Le Chatelier: hệ chuyển dịch theo chiều LÀM GIẢM tác động vừa ' +
        'gây ra, chứ không phải theo chiều "thêm gì thì tạo ra thứ đó".',
      viewBoxWidth: 420,
      viewBoxHeight: 220,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'de',
          points: [
            [180, 190],
            [210, 130],
            [240, 190],
          ],
          closed: true,
          fill: 'muted',
          stroke: 'neutral',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'don',
          x1: 80,
          y1: 128,
          x2: 340,
          y2: 128,
          stroke: 'neutral',
          strokeWidth: 4,
          keyframes: [
            { atMs: 0, rotate: 0 },
            { atMs: 1500, rotate: 0 },
            { atMs: 2600, rotate: -9 },
            { atMs: 5200, rotate: -2 },
            { atMs: 7000, rotate: -2 },
          ],
        },
        {
          kind: 'rect',
          id: 'dia-trai',
          x: 60,
          y: 100,
          w: 90,
          h: 26,
          rx: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 1500, dy: 0 },
            { atMs: 2600, dy: 16.6 },
            { atMs: 5200, dy: 3.7 },
            { atMs: 7000, dy: 3.7 },
          ],
        },
        {
          kind: 'label',
          id: 'trai-t',
          x: 105,
          y: 118,
          text: 'N₂ + 3H₂',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 1500, dy: 0 },
            { atMs: 2600, dy: 16.6 },
            { atMs: 5200, dy: 3.7 },
            { atMs: 7000, dy: 3.7 },
          ],
        },
        {
          kind: 'rect',
          id: 'dia-phai',
          x: 270,
          y: 100,
          w: 90,
          h: 26,
          rx: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 1500, dy: 0 },
            { atMs: 2600, dy: -16.6 },
            { atMs: 5200, dy: -3.7 },
            { atMs: 7000, dy: -3.7 },
          ],
        },
        {
          kind: 'label',
          id: 'phai-t',
          x: 315,
          y: 118,
          text: '2NH₃',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 1500, dy: 0 },
            { atMs: 2600, dy: -16.6 },
            { atMs: 5200, dy: -3.7 },
            { atMs: 7000, dy: -3.7 },
          ],
        },
        {
          kind: 'circle',
          id: 'them-n2',
          cx: 105,
          cy: 30,
          r: 12,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dy: 0 },
            { atMs: 1400, opacity: 0 },
            { atMs: 1500, opacity: 1 },
            { atMs: 2400, dy: 55 },
            { atMs: 2600, opacity: 0, dy: 60 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'them-t',
          x: 105,
          y: 16,
          text: 'bơm thêm N₂',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1500, opacity: 1 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3200, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'chieu-thuan',
          x1: 165,
          y1: 68,
          x2: 265,
          y2: 68,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2800, opacity: 0 },
            { atMs: 3200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'chieu-t',
          x: 215,
          y: 58,
          text: 'cân bằng chuyển dịch theo chiều thuận',
          size: 11,
          anchor: 'middle',
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
          kind: 'label',
          id: 'ghi-chu',
          x: 210,
          y: 210,
          text: 'hệ chống lại tác động: thêm N₂ ⇒ tiêu thụ bớt N₂',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Đòn cân ngang: v(thuận) = v(nghịch), nồng độ các chất không đổi nữa.' },
        { atMs: 1500, text: 'Bơm thêm N₂ — hệ bị đẩy lệch khỏi cân bằng.' },
        { atMs: 3000, text: 'Chiều thuận chạy mạnh hơn để tiêu thụ bớt N₂ vừa thêm vào.' },
        { atMs: 5200, text: 'Hệ đạt cân bằng MỚI, có nhiều NH₃ hơn lúc đầu.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c1-b2',
    grade: '11',
    chapterNumber: 1,
    chapterTitle: 'Cân bằng hoá học',
    lessonNumber: 2,
    title: 'Cân bằng trong dung dịch nước',
    hook:
      'Nước nguyên chất dẫn điện cực kỳ kém, nhưng nước muối hay nước chanh lại dẫn điện rất tốt. ' +
      'Bí ẩn nằm ở sự phân li thành các hạt mang điện chuyển động tự do — gọi là ion.',
    theory:
      'SỰ ĐIỆN LI:\n' +
      '— Sự điện li là quá trình phân li các chất trong nước thành các ion.\n' +
      '— Chất điện li mạnh: phân li hoàn toàn thành ion khi tan trong nước (gồm acid mạnh như HCl, HNO₃, H₂SO₄; base mạnh như NaOH, KOH, Ca(OH)₂; và hầu hết muối). Dùng mũi tên một chiều (→).\n' +
      '— Chất điện li yếu: chỉ phân li một phần thành ion (gồm acid yếu như CH₃COOH, H₂CO₃, H₂S; base yếu như NH₃; nước). Dùng mũi tên hai chiều (⇌).\n\n' +
      'THUYẾT ACID - BASE CỦA BRØNSTED - LOWRY:\n' +
      '— Acid là chất nhường proton (H⁺).\n' +
      '— Base là chất nhận proton (H⁺).\n' +
      '— Ví dụ: NH₃ + H₂O ⇌ NH₄⁺ + OH⁻. H₂O nhường H⁺ cho NH₃ nên H₂O là acid; NH₃ nhận H⁺ tạo NH₄⁺ nên NH₃ là base.\n\n' +
      'TÍCH SỐ ION CỦA NƯỚC VÀ pH:\n' +
      '— Sự tự điện li của nước: H₂O ⇌ H⁺ + OH⁻. Ở 25 °C, tích số ion của nước là Kw = [H⁺][OH⁻] = 10⁻¹⁴.\n' +
      '— Khái niệm pH: pH = −log[H⁺].\n' +
      '— Môi trường: Trung tính (pH = 7, [H⁺] = 10⁻⁷ M); Acid (pH < 7, [H⁺] > 10⁻⁷ M); Base (pH > 7, [H⁺] < 10⁻⁷ M).\n' +
      '— Chất chỉ thị màu: Quỳ tím (hoá đỏ trong acid, hoá xanh trong base); Phenolphthalein (hoá hồng trong base, không màu trong acid/trung tính).\n\n' +
      'CHUẨN ĐỘ ACID - BASE:\n' +
      '— Chuẩn độ là phương pháp xác định nồng độ của một chất bằng một dung dịch chuẩn đã biết nồng độ.\n' +
      '— Điểm tương đương là thời điểm acid và base phản ứng vừa đủ với nhau, nhận biết qua sự đổi màu đột ngột của chất chỉ thị.',
    workedExample: {
      problem: 'Tính pH của dung dịch chứa HCl 0,001 M ở 25 °C.',
      steps: [
        'HCl là acid mạnh, điện li hoàn toàn trong nước: HCl → H⁺ + Cl⁻.',
        'Vì phân li hoàn toàn nên nồng độ H⁺ sinh ra bằng nồng độ ban đầu của HCl: [H⁺] = 0,001 M = 10⁻³ M.',
        'Áp dụng công thức tính pH: pH = −log[H⁺] = −log(10⁻³).',
        'Kết quả: pH = 3.',
      ],
      answer: 'pH = 3',
    },
    checkQuestions: [
      {
        prompt: 'Theo thuyết Brønsted - Lowry, base là chất có khả năng làm gì?',
        choices: [
          { id: 'nhuong', label: 'Nhường proton (H⁺)' },
          { id: 'nhan', label: 'Nhận proton (H⁺)' },
          { id: 'electron', label: 'Nhường cặp electron' },
          { id: 'dienli', label: 'Điện li ra ion OH⁻' },
        ],
        answer: { kind: 'choice', correctIds: ['nhan'] },
        explain:
          'Theo thuyết Brønsted - Lowry, base là chất nhận proton (H⁺), acid là chất nhường proton (H⁺).',
      },
      {
        prompt: 'Một dung dịch có nồng độ [H⁺] = 10⁻⁹ M ở 25 °C. Hãy tính pH của dung dịch này.',
        answer: { kind: 'numeric', value: 9 },
        explain:
          'Theo công thức: pH = −log[H⁺] = −log(10⁻⁹) = 9. pH = 9 > 7 nên dung dịch có tính base (kiềm); nồng độ H⁺ càng nhỏ thì pH càng lớn — dễ nhầm chiều nếu không để ý dấu trừ.',
      },
      {
        // Câu BẪY: quên H₂SO₄ điện li cho HAI ion H⁺ — lỗi "nhầm nồng độ chất với nồng độ H⁺".
        prompt:
          'Tính pH của dung dịch H₂SO₄ 0,001 M ở 25 °C (coi H₂SO₄ điện li hoàn toàn cả hai nấc; ' +
          'làm tròn 1 chữ số thập phân, chỉ nhập số).',
        answer: { kind: 'numeric', value: 2.7, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          'Nếu bạn ra pH = 3 thì đã lấy thẳng nồng độ H₂SO₄ làm nồng độ H⁺. Mỗi phân tử H₂SO₄ ' +
          'cho 2 ion H⁺: H₂SO₄ → 2H⁺ + SO₄²⁻, nên [H⁺] = 2 × 0,001 = 0,002 M. Do đó pH = ' +
          '−log(0,002) ≈ 2,7 — acid hơn (pH nhỏ hơn) so với HCl cùng nồng độ mol. Bài học: luôn ' +
          'đi từ PHƯƠNG TRÌNH ĐIỆN LI ra nồng độ ion, đừng dùng thẳng nồng độ chất.',
      },
    ],
    srsCards: [
      {
        hoi: 'Chất điện li mạnh là gì?',
        dap: 'Là chất phân li hoàn toàn thành ion khi tan trong nước (acid mạnh, base mạnh, hầu hết muối).',
      },
      {
        hoi: 'Định nghĩa acid và base theo Brønsted - Lowry?',
        dap: 'Acid nhường proton (H⁺); Base nhận proton (H⁺).',
      },
      { hoi: 'Tích số ion của nước Kw ở 25 °C bằng bao nhiêu?', dap: 'Kw = [H⁺][OH⁻] = 10⁻¹⁴.' },
      { hoi: 'Công thức tính pH?', dap: 'pH = −log[H⁺].' },
    ],
    animation: {
      title: 'Chuẩn độ acid–base: giọt cuối cùng làm đổi màu',
      description:
        'Trên cùng là buret chứa dung dịch NaOH đã biết nồng độ, dưới là bình tam giác chứa ' +
        'dung dịch HCl cần xác định nồng độ, đã nhỏ sẵn vài giọt phenolphthalein. Từng giọt ' +
        'NaOH rơi xuống, H⁺ và OH⁻ trung hoà nhau theo phương trình ion rút gọn H⁺ + OH⁻ → H₂O. ' +
        'Suốt quá trình đó dung dịch vẫn không màu vì vẫn còn dư H⁺. Đến đúng thời điểm số mol ' +
        'OH⁻ thêm vào bằng số mol H⁺ ban đầu — điểm tương đương — thì chỉ một giọt dư cũng làm ' +
        'pH nhảy vọt và dung dịch chuyển sang hồng nhạt bền. Đó là tín hiệu dừng, đọc thể tích ' +
        'NaOH đã dùng rồi tính nồng độ HCl.',
      viewBoxWidth: 360,
      viewBoxHeight: 240,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'buret',
          points: [
            [166, 10],
            [166, 96],
            [173, 104],
            [179, 104],
            [186, 96],
            [186, 10],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'dd-buret',
          x: 168,
          y: 14,
          w: 16,
          h: 76,
          fill: 'primary',
          opacity: 0.6,
          origin: [176, 90],
          keyframes: [
            { atMs: 0, scaleY: 1 },
            { atMs: 900, scaleY: 0.97 },
            { atMs: 2500, scaleY: 0.94 },
            { atMs: 5100, scaleY: 0.9 },
            { atMs: 7000, scaleY: 0.9 },
          ],
        },
        {
          kind: 'label',
          id: 'buret-t',
          x: 194,
          y: 40,
          text: 'NaOH đã biết nồng độ',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'binh',
          points: [
            [160, 118],
            [160, 150],
            [130, 230],
            [226, 230],
            [196, 150],
            [196, 118],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'dd-khong-mau',
          points: [
            [142, 200],
            [214, 200],
            [224, 228],
            [132, 228],
          ],
          closed: true,
          fill: 'muted',
          opacity: 0.12,
        },
        {
          kind: 'polyline',
          id: 'dd-hong',
          points: [
            [142, 200],
            [214, 200],
            [224, 228],
            [132, 228],
          ],
          closed: true,
          fill: 'danger',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5600, opacity: 0.4 },
            { atMs: 7000, opacity: 0.4 },
          ],
        },
        {
          kind: 'circle',
          id: 'giot1',
          cx: 176,
          cy: 104,
          r: 4,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0, opacity: 1 },
            { atMs: 900, dy: 92, opacity: 1 },
            { atMs: 1000, dy: 92, opacity: 0 },
            { atMs: 7000, dy: 92, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'giot2',
          cx: 176,
          cy: 104,
          r: 4,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 1500, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 2500, dy: 92 },
            { atMs: 2600, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'giot3',
          cx: 176,
          cy: 104,
          r: 4,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 4100, opacity: 0 },
            { atMs: 4200, opacity: 1 },
            { atMs: 5100, dy: 92 },
            { atMs: 5200, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'tt1a',
          x: 12,
          y: 150,
          text: 'còn dư H⁺',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 1,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5200, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'tt1b',
          x: 12,
          y: 165,
          text: '⇒ không màu',
          size: 11,
          anchor: 'start',
          fill: 'muted',
          opacity: 1,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5200, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'tt2a',
          x: 12,
          y: 150,
          text: 'điểm tương đương:',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5200, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'tt2b',
          x: 12,
          y: 165,
          text: 'n(OH⁻) = n(H⁺)',
          size: 11,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5200, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'binh-t',
          x: 12,
          y: 206,
          text: 'bình: HCl +',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'binh-t2',
          x: 12,
          y: 220,
          text: 'phenolphthalein',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'pt',
          x: 194,
          y: 22,
          text: 'H⁺ + OH⁻ → H₂O',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Nhỏ từng giọt NaOH; H⁺ trong bình bị trung hoà dần.' },
        { atMs: 4200, text: 'Gần điểm tương đương, chỉ một giọt cũng làm pH nhảy vọt.' },
        { atMs: 5600, text: 'Dung dịch hoá hồng bền — dừng lại và đọc thể tích NaOH đã dùng.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c1-b3',
    grade: '11',
    chapterNumber: 1,
    chapterTitle: 'Cân bằng hoá học',
    lessonNumber: 3,
    title: 'Ôn tập chương 1 — Cân bằng hoá học',
    hook:
      'Cân bằng hoá học và cân bằng trong dung dịch là nền tảng cốt lõi giải thích hoạt động của cơ thể ' +
      '(như hệ đệm pH trong máu) cho đến các nhà máy sản xuất hoá chất quy mô lớn.',
    theory:
      'HỆ THỐNG HOÁ KIẾN THỨC CHƯƠNG 1:\n' +
      '1. Cân bằng hoá học là trạng thái động, vt = vn. Kc chỉ phụ thuộc vào nhiệt độ, không phụ thuộc vào nồng độ các chất.\n' +
      '2. Chuyển dịch cân bằng tuân theo nguyên lí Le Chatelier. Các yếu tố ảnh hưởng gồm: Nhiệt độ (luôn ảnh hưởng), Nồng độ, Áp suất (chỉ ảnh hưởng khi có chất khí và có sự thay đổi số phân tử khí).\n' +
      '3. Sự điện li chia làm điện li mạnh (→) và điện li yếu (⇌).\n' +
      '4. Thuyết acid-base của Brønsted-Lowry mở rộng khái niệm acid/base không chỉ giới hạn trong nước (acid nhường H⁺, base nhận H⁺).\n' +
      '5. Môi trường acid pH < 7, trung tính pH = 7, base pH > 7 (ở 25 °C). Chuẩn độ acid-base dựa trên phản ứng trung hoà giữa H⁺ và OH⁻.',
    workedExample: {
      problem:
        'Trộn 100 mL dung dịch acid mạnh HNO₃ 0,1 M với 100 mL dung dịch base mạnh NaOH 0,1 M ở 25 °C. ' +
        'Tính pH của dung dịch sau khi trộn.',
      steps: [
        'Tính số mol H⁺ từ HNO₃: nH⁺ = 0,1 M * 0,1 L = 0,01 mol.',
        'Tính số mol OH⁻ từ NaOH: nOH⁻ = 0,1 M * 0,1 L = 0,01 mol.',
        'Viết phương trình ion rút gọn của phản ứng trung hoà: H⁺ + OH⁻ → H₂O.',
        'Vì nH⁺ = nOH⁻ = 0,01 mol nên hai chất phản ứng vừa đủ với nhau.',
        'Dung dịch sau phản ứng chỉ chứa muối trung tính NaNO₃ và nước, không dư acid hay base. Môi trường trung tính.',
        'Kết quả ở 25 °C: pH = 7.',
      ],
      answer: 'pH = 7',
    },
    checkQuestions: [
      {
        prompt: 'Phản ứng nào sau đây thuộc loại phản ứng thuận nghịch?',
        choices: [
          { id: 'a', label: 'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)' },
          { id: 'b', label: 'NaOH + HCl → NaCl + H₂O' },
          { id: 'c', label: '2H₂ + O₂ → 2H₂O (đốt cháy)' },
          { id: 'd', label: 'Fe + 2HCl → FeCl₂ + H₂' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Phản ứng tổng hợp NH₃ là phản ứng thuận nghịch nổi tiếng (sử dụng mũi tên hai chiều ⇌). Các phản ứng còn lại đều xảy ra một chiều đến cùng.',
      },
      {
        prompt: 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu đỏ?',
        choices: [
          { id: 'hcl', label: 'HCl 0,1 M' },
          { id: 'naoh', label: 'NaOH 0,1 M' },
          { id: 'nacl', label: 'NaCl 0,1 M' },
          { id: 'c2h5oh', label: 'C₂H₅OH (ethanol)' },
        ],
        answer: { kind: 'choice', correctIds: ['hcl'] },
        explain:
          'HCl là acid mạnh, tạo môi trường acid (pH < 7) làm quỳ tím hoá đỏ. NaOH làm quỳ tím hoá xanh. NaCl và ethanol trung tính không làm đổi màu quỳ.',
      },
    ],
    srsCards: [
      { hoi: 'Kc thay đổi khi nào?', dap: 'Chỉ thay đổi khi nhiệt độ thay đổi.' },
      {
        hoi: 'Chất xúc tác có làm cân bằng chuyển dịch không?',
        dap: 'Không. Chất xúc tác chỉ giúp hệ đạt tới trạng thái cân bằng nhanh hơn (tăng cả vt và vn cùng một số lần).',
      },
      {
        hoi: 'Tại sao chuẩn độ acid-base cần chất chỉ thị?',
        dap: 'Để nhận biết thời điểm dừng chuẩn độ (điểm tương đương) khi acid và base phản ứng vừa đủ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
