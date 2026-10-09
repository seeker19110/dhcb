// lyhsgcohoc.ts — Chuyên đề bồi dưỡng HỌC SINH GIỎI môn Vật lí, mảng CƠ HỌC.
//
// Đánh số chương 91 để tách hẳn khỏi các chương của chương trình chuẩn (c1..c7) mà vẫn
// giữ đúng khuôn id `ly<lớp>-c<chương>-b<bài>` do PhysicsLessonSchema quy định.
// Ba bài đi từ dễ lên khó theo đúng ba cấp kì thi thật ở Việt Nam:
//   b1 (hsg-truong)    — với tới được từ chương trình chuẩn, chỉ cần kỷ luật tách vật.
//   b2 (hsg-tinh)      — thêm công cụ mới: hệ quy chiếu phi quán tính và lực quán tính.
//   b3 (hsg-quoc-gia)  — phối hợp hai định luật bảo toàn trên hệ có cả hai vật cùng chuyển động.
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY_HSG_CO_HOC_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c91-b1',
    grade: '10',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG: Cơ học',
    lessonNumber: 1,
    title: 'Cơ hệ nhiều vật nối dây: kỷ luật tách vật',
    hook:
      'Trong đề thi học sinh giỏi cấp trường, bài động lực học hiếm khi chỉ có một vật. Thường là hai ba vật nối nhau qua ' +
      'ròng rọc, hoặc chồng lên nhau. Nhiều bạn giải đúng bài một vật nhưng lúng túng ngay khi thêm vật thứ hai — không phải ' +
      'vì kiến thức thiếu, mà vì chưa có một quy trình cố định để tách hệ ra.',
    theory:
      'HAI CÁCH NHÌN MỘT CƠ HỆ — biết cả hai mới giải nhanh:\n' +
      '— Cách 1 (xem cả hệ là MỘT vật): chỉ dùng được khi mọi vật có cùng độ lớn gia tốc (nối bằng dây không dãn). ' +
      'Khi đó nội lực (lực căng dây giữa các vật trong hệ) tự triệt tiêu từng cặp theo định luật 3 Newton, ' +
      'chỉ còn ngoại lực: a = (tổng ngoại lực theo phương chuyển động) / (tổng khối lượng). Cách này cho GIA TỐC rất nhanh ' +
      'nhưng KHÔNG bao giờ cho ra lực căng dây, vì lực căng đã bị triệt tiêu mất.\n' +
      '— Cách 2 (TÁCH từng vật): viết định luật 2 Newton riêng cho mỗi vật, lực căng dây trở thành ngoại lực và hiện ra ' +
      'trong phương trình. Đây là cách duy nhất tìm được lực căng, phản lực, hay điều kiện để dây không đứt.\n\n' +
      '## Quy trình bốn bước (làm đúng thứ tự thì không sai dấu)\n' +
      '1. Chọn CHIỀU DƯƠNG cho từng vật theo đúng chiều nó thật sự chuyển động. Với hệ qua ròng rọc, chiều dương của hai vật ' +
      'nằm trên hai phương khác nhau — điều đó hoàn toàn được phép, miễn là nhất quán.\n' +
      '2. Vẽ đủ lực đặt LÊN TỪNG VẬT, không vẽ lẫn lực đặt lên vật khác. Mẹo rà: mỗi lực phải trả lời được câu hỏi ' +
      '"vật nào tác dụng lực này?". Không trả lời được thì lực đó không có thật.\n' +
      '3. Chiếu định luật 2 Newton lên chiều dương đã chọn cho từng vật, được hệ phương trình.\n' +
      '4. Cộng vế hoặc thế để khử lực căng T, tìm a trước, rồi thay ngược lại tìm T.\n\n' +
      'RÀNG BUỘC ĐỘNG HỌC — thứ thường bị quên:\n' +
      '— Dây không dãn, vắt qua ròng rọc nhẹ: hai vật có cùng độ lớn gia tốc, và lực căng ở hai nhánh dây bằng nhau. ' +
      'Nếu ròng rọc CÓ khối lượng đáng kể thì hai nhánh dây không còn cùng lực căng — bài đó thuộc phần vật rắn quay.\n' +
      '— Hai vật chồng lên nhau và đi cùng nhau: ràng buộc là cùng gia tốc, và điều kiện để chúng không trượt lên nhau ' +
      'luôn quy về so sánh lực ma sát cần thiết với lực ma sát nghỉ cực đại.\n\n' +
      'ĐIỀU KIỆN ÁP DỤNG VÀ GIỚI HẠN: mọi công thức trong bài giả thiết dây không dãn, khối lượng dây và ròng rọc không đáng kể, ' +
      'ròng rọc quay không ma sát. Bỏ một trong các giả thiết đó thì kết quả thay đổi và phải giải lại từ bước 2.',
    workedExample: {
      problem:
        'Vật A khối lượng m₁ = 3 kg nằm trên mặt bàn nằm ngang nhẵn, nối với vật B khối lượng m₂ = 2 kg bằng một sợi dây ' +
        'không dãn vắt qua ròng rọc nhẹ gắn ở mép bàn; vật B treo lơ lửng. Thả cho hệ chuyển động, lấy g = 10 m/s². ' +
        'Tính gia tốc của hệ và lực căng của sợi dây.',
      steps: [
        'Chọn chiều dương: với A là chiều sang phải (hướng về ròng rọc), với B là chiều hướng xuống. Hai vật nối bằng dây không dãn nên cùng độ lớn gia tốc a.',
        'Tách vật A: các lực theo phương ngang chỉ có lực căng T (bàn nhẵn nên không có ma sát). Định luật 2 Newton: T = m₁·a. (1)',
        'Tách vật B: các lực theo phương thẳng đứng gồm trọng lực P₂ = m₂·g hướng xuống (cùng chiều dương) và lực căng T hướng lên. Định luật 2 Newton: m₂·g − T = m₂·a. (2)',
        'Cộng vế (1) và (2) để khử T — đây chính là lý do đặt chiều dương "theo chiều chuyển động của từng vật": m₂·g = (m₁ + m₂)·a.',
        'Suy ra gia tốc: a = m₂·g / (m₁ + m₂) = (2 × 10) / (3 + 2) = 20 / 5 = 4 (m/s²).',
        'Thay a vào (1) để tìm lực căng: T = m₁·a = 3 × 4 = 12 (N).',
        'Kiểm tra tính hợp lý: T = 12 N nhỏ hơn trọng lượng của B là P₂ = 20 N — đúng như phải thế, vì B đang đi xuống nhanh dần nên hợp lực trên B phải hướng xuống.',
      ],
      answer: 'a = 4 m/s²; T = 12 N.',
    },
    checkQuestions: [
      {
        prompt:
          'Vật A khối lượng 4 kg trên mặt bàn nằm ngang nhẵn được nối qua ròng rọc nhẹ với vật B khối lượng 1 kg treo lơ lửng. Lấy g = 10 m/s². Tính độ lớn gia tốc của hệ (theo m/s²).',
        variables: { a: 'm/s^2', m_A: 'kg', m_B: 'kg', T: 'N' },
        answer: {
          kind: 'numeric',
          value: 2,
          unit: 'm/s²',
        },
        explain:
          'Xem cả hệ là một vật: ngoại lực duy nhất theo phương chuyển động là trọng lực của B, a = m_B·g/(m_A + m_B) = 10/5 = 2 m/s².',
      },
      {
        prompt:
          'Vẫn hệ trên (A = 4 kg trên bàn nhẵn, B = 1 kg treo, g = 10 m/s², a = 2 m/s²). Tính lực căng dây (theo N).',
        variables: { a: 'm/s^2', m_A: 'kg', m_B: 'kg', T: 'N' },
        answer: {
          kind: 'numeric',
          value: 8,
          unit: 'N',
        },
        explain:
          'Tách vật A: theo phương ngang chỉ có lực căng, nên T = m_A·a = 4 × 2 = 8 N. Kiểm lại bằng vật B: m_B·g − T = 10 − 8 = 2 N = m_B·a — khớp.',
      },
      {
        // Câu bẫy: coi lực căng dây bằng trọng lượng vật treo, vốn chỉ đúng khi hệ đứng yên.
        prompt:
          'Trong hệ ròng rọc nói trên, một bạn lập luận: "Dây treo vật B nên lực căng dây luôn bằng trọng lượng của B, T = m_B·g = 10 N". Nhận xét nào đúng?',
        choices: [
          { id: 'dung_luon', label: 'Lập luận đúng, lực căng dây luôn bằng trọng lượng vật treo' },
          {
            id: 'chi_dung_khi_can_bang',
            label:
              'Chỉ đúng khi vật B đứng yên hoặc đi đều; khi B có gia tốc thì T = m_B(g − a), nhỏ hơn trọng lượng',
          },
          { id: 'luon_lon_hon', label: 'Sai, lực căng dây luôn lớn hơn trọng lượng vật treo' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['chi_dung_khi_can_bang'],
        },
        explain:
          'T = P chỉ là hệ quả của điều kiện CÂN BẰNG, không phải một tính chất của dây. Khi B đi xuống nhanh dần, hợp lực trên B phải hướng xuống, nghĩa là P phải THẮNG T, nên bắt buộc T < P: T = m_B(g − a) = 1 × (10 − 2) = 8 N. ' +
          'Ngược lại, nếu kéo B đi lên nhanh dần thì T = m_B(g + a) > P. Đó cũng là lý do dây cáp thang máy dễ đứt nhất lúc khởi động đi lên chứ không phải lúc chở khách đứng yên. ' +
          'Quy tắc an toàn khi làm bài: không bao giờ gán trước giá trị cho lực căng; hãy để nó là ẩn T và để hệ phương trình tự trả lời.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khi nào được phép gộp cả hệ thành một vật để tìm gia tốc?',
        dap: 'Khi mọi vật trong hệ có cùng độ lớn gia tốc; khi đó nội lực triệt tiêu và a = tổng ngoại lực / tổng khối lượng. Cách này không cho ra lực căng dây.',
      },
      {
        hoi: 'Muốn tìm lực căng dây thì bắt buộc phải làm gì?',
        dap: 'Phải tách riêng từng vật và viết định luật 2 Newton cho vật đó — lúc ấy lực căng mới là ngoại lực và xuất hiện trong phương trình.',
      },
      {
        hoi: 'Lực căng dây treo một vật có luôn bằng trọng lượng vật đó không?',
        dap: 'Không. Chỉ bằng khi vật cân bằng. Vật đi xuống nhanh dần thì T = m(g − a) < P; đi lên nhanh dần thì T = m(g + a) > P.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c91-b2',
    grade: '10',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG: Cơ học',
    lessonNumber: 2,
    title: 'Hệ quy chiếu phi quán tính và lực quán tính',
    hook:
      'Ngồi trên xe khách đang tăng tốc rời bến, bạn thấy chai nước treo lủng lẳng trước kính lệch hẳn về phía sau và ' +
      'đứng yên ở vị trí lệch đó suốt thời gian xe tăng tốc. Với bạn, chai nước đang CÂN BẰNG — nhưng hai lực quen thuộc ' +
      '(trọng lực và lực căng dây) rõ ràng không thể cân bằng nhau khi dây lệch. Vậy còn lực thứ ba nào nữa?',
    theory:
      '## Hệ quy chiếu quán tính và phi quán tính\n' +
      '— Hệ quy chiếu quán tính là hệ mà trong đó định luật 1 Newton nghiệm đúng (mặt đất, hoặc bất cứ hệ nào chuyển động ' +
      'thẳng đều so với mặt đất).\n' +
      '— Hệ quy chiếu PHI QUÁN TÍNH là hệ gắn với vật đang có gia tốc (xe tăng tốc, thang máy khởi động, đĩa quay). ' +
      'Trong hệ này, một vật không chịu lực nào vẫn có thể "tự" chuyển động có gia tốc — định luật 1 Newton không còn đúng.\n\n' +
      'LỰC QUÁN TÍNH (INERTIAL FORCE) — VÌ SAO phải bịa ra nó:\n' +
      '— Muốn tiếp tục dùng bộ công cụ quen thuộc (định luật 2 Newton, điều kiện cân bằng) trong hệ phi quán tính, người ta ' +
      'thêm vào một số hạng đúng bằng −m·a₀ (a₀ là gia tốc của hệ quy chiếu so với mặt đất) và gọi nó là lực quán tính F_qt.\n' +
      '— Đặc điểm: độ lớn F_qt = m·a₀, hướng NGƯỢC với gia tốc của hệ quy chiếu, đặt tại trọng tâm vật.\n' +
      '— Lực quán tính KHÔNG có phản lực, vì không có vật nào tác dụng nó cả — nó là hệ quả của việc chọn hệ quy chiếu. ' +
      'Đây là điểm khác biệt căn bản với mọi lực thật (hấp dẫn, đàn hồi, ma sát) vốn luôn đi theo cặp trực đối.\n' +
      '— GIỚI HẠN: chỉ dùng được khi đã khai báo rõ "xét trong hệ quy chiếu gắn với…". Viết lực quán tính vào một bài giải ' +
      'lấy mặt đất làm mốc là sai về bản chất, dù đôi khi ra đúng số.\n\n' +
      '## Trọng lực hiệu dụng\n' +
      '— Trong hệ phi quán tính, trọng lực và lực quán tính luôn đi cùng nhau nên ta gộp lại thành trọng lực hiệu dụng: ' +
      'vectơ P_hd = vectơ P + vectơ F_qt, ứng với gia tốc trọng trường hiệu dụng g_hd = |vectơ g − vectơ a₀|.\n' +
      '— Hệ quả rất hay dùng: với xe chạy ngang có gia tốc a₀, dây treo lệch góc α với tan α = a₀/g, và lực căng ' +
      'T = m·√(a₀² + g²). Với thang máy đi lên nhanh dần (a₀ hướng lên): g_hd = g + a₀; đi xuống nhanh dần: g_hd = g − a₀; ' +
      'rơi tự do (a₀ = g): g_hd = 0 — trạng thái không trọng lượng.\n\n' +
      'KIỂM TRA CHÉO: bài nào cũng giải được bằng hai cách — (1) đứng ở mặt đất, viết định luật 2 Newton với gia tốc a₀; ' +
      '(2) đứng trong hệ chuyển động, thêm lực quán tính rồi cho vật cân bằng. Hai cách phải ra cùng một đáp số; ' +
      'nếu lệch thì chắc chắn đã sai chiều lực quán tính.',
    workedExample: {
      problem:
        'Một quả cầu khối lượng m = 0,5 kg treo bằng sợi dây nhẹ vào trần một toa xe đang chuyển động nhanh dần đều theo ' +
        'phương ngang với gia tốc a₀ = 5 m/s². Lấy g = 10 m/s². Tính góc lệch của dây treo so với phương thẳng đứng và ' +
        'lực căng của dây.',
      steps: [
        'Chọn hệ quy chiếu gắn với toa xe — đây là hệ phi quán tính vì xe có gia tốc a₀ hướng về phía trước. Phải khai báo rõ điều này trước khi dùng lực quán tính.',
        'Trong hệ này quả cầu ĐỨNG YÊN, nên tổng các lực tác dụng lên nó (kể cả lực quán tính) bằng không: vectơ P + vectơ T + vectơ F_qt = vectơ 0.',
        'Lực quán tính có độ lớn F_qt = m·a₀ = 0,5 × 5 = 2,5 N, hướng NGƯỢC chiều gia tốc của xe, tức hướng về phía sau — đúng với quan sát dây lệch về sau.',
        'Trọng lực P = m·g = 0,5 × 10 = 5 N hướng thẳng đứng xuống. Hai lực P và F_qt vuông góc nhau, hợp lại thành trọng lực hiệu dụng, và dây phải nằm dọc theo trọng lực hiệu dụng đó (vì T phải trực đối với hợp lực của hai lực kia).',
        'Góc lệch α của dây so với phương thẳng đứng: tan α = F_qt / P = m·a₀ / (m·g) = a₀/g = 5/10 = 0,5. Suy ra α ≈ 26,6°. Chú ý khối lượng m bị triệt tiêu: góc lệch không phụ thuộc vật nặng hay nhẹ.',
        'Lực căng dây bằng độ lớn trọng lực hiệu dụng: T = m·√(a₀² + g²) = 0,5 × √(25 + 100) = 0,5 × √125 ≈ 5,59 (N).',
        'Kiểm tra chéo bằng hệ quy chiếu mặt đất: theo phương ngang T·sin α = m·a₀, theo phương thẳng đứng T·cos α = m·g. Chia hai vế được tan α = a₀/g, bình phương rồi cộng được T = m√(a₀² + g²) — trùng khớp.',
      ],
      answer: 'tan α = 0,5 (α ≈ 26,6°); T ≈ 5,59 N.',
    },
    checkQuestions: [
      {
        prompt:
          'Một con lắc treo trong toa xe chuyển động nhanh dần đều theo phương ngang với gia tốc a₀ = 4 m/s², lấy g = 10 m/s². Tính tan của góc lệch của dây treo so với phương thẳng đứng.',
        variables: { a_0: 'm/s^2', a: 'm/s^2', α: '' },
        answer: {
          kind: 'numeric',
          value: 0.4,
        },
        explain:
          'tan α = a₀/g = 4/10 = 0,4. Khối lượng quả cầu không ảnh hưởng vì nó bị triệt tiêu ở cả tử số lẫn mẫu số.',
      },
      {
        prompt:
          'Một người khối lượng 60 kg đứng trên cân trong thang máy đang đi LÊN nhanh dần đều với gia tốc 2 m/s² (g = 10 m/s²). Cân chỉ số chỉ trọng lượng biểu kiến bằng bao nhiêu N?',
        variables: { m: 'kg', a_0: 'm/s^2', a: 'm/s^2', 'g_{hd}': 'm/s^2', N: 'N' },
        answer: {
          kind: 'numeric',
          value: 720,
          unit: 'N',
        },
        explain:
          'Trong hệ gắn với thang máy, lực quán tính hướng xuống (ngược gia tốc hướng lên) nên g_hd = g + a₀ = 12 m/s². Số chỉ của cân là phản lực N = m·g_hd = 60 × 12 = 720 N, lớn hơn trọng lượng thật 600 N — đúng cảm giác "nặng người" lúc thang máy khởi động đi lên.',
      },
      {
        // Câu bẫy: coi lực quán tính là một lực thật, có phản lực theo định luật 3 Newton.
        prompt: 'Nhận định nào sau đây về lực quán tính là ĐÚNG?',
        choices: [
          {
            id: 'co_phan_luc',
            label:
              'Lực quán tính tuân theo định luật 3 Newton, nên vật cũng tác dụng lại một phản lực trực đối',
          },
          {
            id: 'khong_phan_luc',
            label:
              'Lực quán tính không có phản lực vì không do vật nào tác dụng; nó chỉ xuất hiện khi ta chọn hệ quy chiếu phi quán tính',
          },
          {
            id: 'luon_ton_tai',
            label:
              'Lực quán tính luôn tồn tại với mọi vật, kể cả khi xét trong hệ quy chiếu gắn với mặt đất',
          },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['khong_phan_luc'],
        },
        explain:
          'Mọi LỰC THẬT đều trả lời được câu hỏi "vật nào tác dụng?" và luôn đi theo cặp trực đối đặt lên hai vật (định luật 3 Newton). Lực quán tính không trả lời được câu hỏi đó — không có vật nào đẩy chai nước về phía sau cả — nên nó không có phản lực. ' +
          'Nó chỉ là số hạng bù −m·a₀ ta thêm vào để định luật 2 Newton còn dùng được trong hệ đang có gia tốc. ' +
          'Hệ quả thực hành rất quan trọng: chỉ được viết lực quán tính vào bài giải SAU KHI đã ghi rõ "xét trong hệ quy chiếu gắn với xe/thang máy". Nếu bài giải lấy mặt đất làm mốc mà vẫn vẽ thêm lực quán tính thì hệ vật bị tính dư lực, và đó là lỗi trừ điểm nặng trong đề thi học sinh giỏi.',
      },
    ],
    srsCards: [
      {
        hoi: 'Lực quán tính có độ lớn và hướng thế nào?',
        dap: 'F_qt = m·a₀, hướng NGƯỢC với gia tốc a₀ của hệ quy chiếu so với mặt đất, đặt tại trọng tâm vật.',
      },
      {
        hoi: 'Vì sao nói lực quán tính không phải lực thật?',
        dap: 'Vì không có vật nào tác dụng nó, nên nó không có phản lực; nó biến mất khi ta chuyển về hệ quy chiếu quán tính.',
      },
      {
        hoi: 'Gia tốc trọng trường hiệu dụng trong thang máy đi lên nhanh dần và rơi tự do bằng bao nhiêu?',
        dap: 'Đi lên nhanh dần: g_hd = g + a₀. Rơi tự do: g_hd = 0, vật ở trạng thái không trọng lượng.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c91-b3',
    grade: '10',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG: Cơ học',
    lessonNumber: 3,
    title: 'Vật trượt trên nêm tự do: phối hợp hai định luật bảo toàn',
    hook:
      'Bài toán vật trượt xuống một cái nêm là bài quen thuộc — cho tới khi đề bỏ đi một chữ: cái nêm KHÔNG được giữ cố định, ' +
      'nó tự do trượt trên sàn nhẵn. Lúc đó nêm bị đẩy lùi trong khi vật trượt xuống, cả hai đều chuyển động, và cách giải ' +
      'bằng định luật 2 Newton trở nên rối rắm vì gia tốc của vật phải tính trong hệ đang chuyển động. Đây là dạng bài ' +
      'gần như năm nào cũng gặp ở kì thi cấp quốc gia, và chìa khoá là hai định luật bảo toàn.',
    theory:
      '## Vì sao chọn bảo toàn chứ không chọn động lực học\n' +
      '— Định luật bảo toàn chỉ so sánh trạng thái ĐẦU với trạng thái CUỐI, nên ta không cần biết quá trình ở giữa diễn ra ' +
      'phức tạp thế nào — trong khi viết định luật 2 Newton thì phải mô tả từng thời điểm.\n' +
      '— Với hệ vật + nêm trên sàn nhẵn, hai định luật bảo toàn dưới đây cho đủ hai phương trình để tìm hai ẩn vận tốc.\n\n' +
      'BẢO TOÀN ĐỘNG LƯỢNG THEO PHƯƠNG NGANG — điều kiện áp dụng phải nói rõ:\n' +
      '— Các ngoại lực đặt lên hệ (vật + nêm) gồm: trọng lực của hai vật và phản lực của sàn. Cả ba đều có phương THẲNG ĐỨNG ' +
      '(sàn nhẵn nên không có ma sát ngang).\n' +
      '— Vậy hình chiếu của tổng ngoại lực lên phương ngang bằng 0 → động lượng của hệ theo phương NGANG được bảo toàn. ' +
      'Chú ý: động lượng theo phương thẳng đứng KHÔNG bảo toàn, vì trọng lực và phản lực sàn nói chung không bù trừ nhau ' +
      'trong lúc vật đang trượt. Đây là chỗ nhiều bạn viết bừa "bảo toàn động lượng" cho cả hai phương và mất điểm.\n' +
      '— Ban đầu hệ đứng yên nên tổng động lượng ngang bằng 0, và nó phải giữ bằng 0 suốt quá trình: ' +
      'm·v₁ = M·v₂ (v₁, v₂ là độ lớn vận tốc ngang của vật và của nêm, ngược chiều nhau). ' +
      'Hệ quả đẹp: khối tâm của hệ không hề dịch chuyển theo phương ngang.\n\n' +
      'BẢO TOÀN CƠ NĂNG — điều kiện áp dụng:\n' +
      '— Áp dụng được khi mọi bề mặt đều nhẵn (không ma sát) và vật không rời khỏi mặt nêm. Khi đó phản lực vuông góc ' +
      'giữa vật và nêm là nội lực, và tổng công của cặp nội lực này bằng 0 dù mỗi lực riêng lẻ đều sinh công khác 0.\n' +
      '— m·g·h = ½·m·v₁² + ½·M·v₂², với h là độ cao vật đã hạ xuống so với sàn.\n' +
      '— Nếu mặt nêm CÓ ma sát thì cơ năng không còn bảo toàn (phần hao hụt bằng công của lực ma sát), nhưng động lượng ' +
      'ngang của hệ VẪN bảo toàn vì ma sát giữa vật và nêm là nội lực.\n\n' +
      'MẸO KIỂM TRA KẾT QUẢ: cho M → ∞ (nêm rất nặng, coi như cố định) thì công thức phải trở về kết quả quen thuộc ' +
      'v₁ = √(2gh). Nếu thay vào mà không ra được như vậy thì bài giải đã sai ở đâu đó.',
    workedExample: {
      problem:
        'Một vật nhỏ khối lượng m = 1 kg được thả không vận tốc đầu từ đỉnh một cái nêm nhẵn khối lượng M = 3 kg, ' +
        'đặt trên sàn nằm ngang nhẵn. Độ cao của đỉnh nêm so với chân nêm là h = 0,6 m. Lấy g = 10 m/s². ' +
        'Tính vận tốc của vật và của nêm (so với mặt đất) ngay khi vật vừa trượt tới chân nêm.',
      steps: [
        'Chọn chiều dương của trục ngang là chiều vật trượt ra (giả sử sang phải). Gọi v₁ là độ lớn vận tốc ngang của vật khi tới chân nêm, v₂ là độ lớn vận tốc của nêm (hướng sang trái). Ở chân nêm mặt nêm nằm ngang nên vận tốc vật cũng nằm ngang.',
        'Bảo toàn động lượng theo phương ngang (mọi ngoại lực đều thẳng đứng, sàn nhẵn): tổng động lượng ngang lúc đầu bằng 0 nên m·v₁ − M·v₂ = 0, suy ra v₂ = m·v₁/M = v₁/3. (1)',
        'Bảo toàn cơ năng (mọi mặt đều nhẵn): m·g·h = ½·m·v₁² + ½·M·v₂². (2)',
        'Thế (1) vào (2): 1 × 10 × 0,6 = ½ × 1 × v₁² + ½ × 3 × (v₁/3)² = ½·v₁² + (1/6)·v₁².',
        'Rút gọn vế phải: ½ + 1/6 = 2/3, nên 6 = (2/3)·v₁² → v₁² = 9 → v₁ = 3 (m/s).',
        'Thay lại (1): v₂ = 3/3 = 1 (m/s), nêm lùi sang trái với tốc độ 1 m/s.',
        'Kiểm tra bằng trường hợp giới hạn: nếu nêm được giữ chặt (M rất lớn) thì v₁ phải bằng √(2gh) = √12 ≈ 3,46 m/s. Kết quả 3 m/s nhỏ hơn giá trị đó là hợp lý, vì một phần cơ năng đã chuyển cho nêm.',
      ],
      answer: 'v₁ = 3 m/s (vật, hướng sang phải); v₂ = 1 m/s (nêm, hướng sang trái).',
    },
    checkQuestions: [
      {
        prompt:
          'Vật m = 2 kg trượt không ma sát từ đỉnh nêm M = 2 kg cao h = 0,8 m, nêm đặt trên sàn nhẵn và tự do. Lấy g = 10 m/s². Tính tốc độ của vật so với mặt đất khi nó tới chân nêm (theo m/s).',
        variables: { m: 'kg', M: 'kg', h: 'm', v_1: 'm/s', v_2: 'm/s', v: 'm/s' },
        answer: {
          kind: 'numeric',
          value: 2.83,
          unit: 'm/s',
          tolerance: { mode: 'relative', pct: 1 },
        },
        explain:
          'Bảo toàn động lượng ngang: 2·v₁ = 2·v₂ nên v₂ = v₁. Bảo toàn cơ năng: m·g·h = ½·m·v₁² + ½·M·v₂² → 16 = v₁² + v₁² = 2v₁² → v₁ = √8 ≈ 2,83 m/s. So sánh: nếu nêm bị giữ chặt thì v₁ = √(2gh) = 4 m/s, lớn hơn — đúng như dự đoán vì lúc này nêm đã lấy đi một nửa động năng.',
      },
      {
        prompt:
          'Vẫn hệ vật m = 1 kg trên nêm M = 3 kg trong bài mẫu (v₁ = 3 m/s). Tính tổng động lượng theo phương ngang của hệ ngay khi vật tới chân nêm (theo kg·m/s).',
        variables: { m: 'kg', M: 'kg', v_1: 'm/s', v_2: 'm/s', p: 'kg·m/s' },
        answer: {
          kind: 'numeric',
          value: 0,
          unit: 'kg.m/s',
        },
        explain:
          'Hệ xuất phát từ trạng thái đứng yên và không có ngoại lực nào theo phương ngang, nên tổng động lượng ngang giữ nguyên bằng 0 ở MỌI thời điểm: 1 × 3 + 3 × (−1) = 0. Kết quả này cũng nói rằng khối tâm của hệ không hề dịch chuyển theo phương ngang — một cách kiểm tra rất nhanh cho dạng bài này.',
      },
      {
        // Câu bẫy: áp dụng bảo toàn động lượng cho cả phương thẳng đứng, hoặc cho hệ có ma sát.
        prompt:
          'Nếu mặt nêm CÓ ma sát (sàn vẫn nhẵn), hai định luật bảo toàn dùng ở trên còn đúng định luật nào?',
        choices: [
          { id: 'ca_hai', label: 'Cả hai, vì ma sát chỉ là nội lực của hệ' },
          {
            id: 'chi_dong_luong',
            label:
              'Chỉ còn bảo toàn động lượng theo phương ngang; cơ năng không bảo toàn vì ma sát chuyển một phần thành nhiệt',
          },
          {
            id: 'chi_co_nang',
            label: 'Chỉ còn bảo toàn cơ năng; động lượng không bảo toàn vì ma sát là lực cản',
          },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['chi_dong_luong'],
        },
        explain:
          'Phải phân biệt hai câu hỏi khác nhau. (1) Động lượng ngang bảo toàn hay không phụ thuộc NGOẠI lực theo phương ngang — ma sát giữa vật và nêm là NỘI lực của hệ, hai lực trực đối triệt tiêu nhau, nên động lượng ngang vẫn bảo toàn y như cũ. ' +
          '(2) Cơ năng bảo toàn hay không phụ thuộc có lực ma sát sinh công hay không — ở đây có, nên cơ năng giảm đúng bằng nhiệt lượng toả ra: m·g·h = ½m·v₁² + ½M·v₂² + Q. ' +
          'Hai lỗi hay gặp ngược nhau: có bạn thấy "có ma sát" là bỏ luôn bảo toàn động lượng, có bạn thì viết bảo toàn cơ năng cho cả bài có ma sát. Thêm một lỗi thứ ba: viết bảo toàn động lượng cho phương THẲNG ĐỨNG — sai, vì theo phương đó trọng lực và phản lực sàn nói chung không triệt tiêu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Vì sao động lượng của hệ vật + nêm chỉ bảo toàn theo phương ngang?',
        dap: 'Vì mọi ngoại lực (trọng lực, phản lực sàn nhẵn) đều có phương thẳng đứng, nên hình chiếu tổng ngoại lực lên phương ngang bằng 0.',
      },
      {
        hoi: 'Hai phương trình dùng để giải bài vật trượt trên nêm tự do, sàn và nêm đều nhẵn?',
        dap: 'm·v₁ = M·v₂ (bảo toàn động lượng ngang) và m·g·h = ½m·v₁² + ½M·v₂² (bảo toàn cơ năng).',
      },
      {
        hoi: 'Cách kiểm tra nhanh kết quả bài nêm tự do?',
        dap: 'Cho M → ∞ (nêm cố định), công thức phải trở về v₁ = √(2gh); và tổng động lượng ngang của hệ phải luôn bằng 0 nếu hệ xuất phát từ trạng thái nghỉ.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
