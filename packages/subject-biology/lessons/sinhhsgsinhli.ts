// sinhhsgsinhli.ts — Chuyên đề bồi dưỡng HỌC SINH GIỎI môn Sinh học, mảng SINH LÍ THỰC VẬT
// VÀ ĐỘNG VẬT (lớp 11).
//
// Đánh số chương 92 để tách hẳn khỏi các chương của chương trình chuẩn mà vẫn giữ đúng khuôn id
// `sinh<lớp>-c<chương>-b<bài>` do BiologyLessonSchema quy định (tiền lệ: `lyhsgcohoc.ts`, c91).
// Ba bài đi từ dễ lên khó theo đúng ba cấp kì thi thật ở Việt Nam:
//   b1 (hsg-truong)    — quang hợp C3, C4, CAM: so sánh cơ chế, đọc thí nghiệm chuông kín và điểm bù.
//   b2 (hsg-tinh)      — tuần hoàn: chu kì tim, lưu lượng tim, huyết áp và vận tốc máu, có tính toán.
//   b3 (hsg-quoc-gia)  — điện thế nghỉ, điện thế hoạt động: phương trình Nernst, các pha, thời kì trơ.
import type { BiologyLesson } from '../lessonTypes.js'

export const SINH_HSG_SINH_LI_LESSONS: BiologyLesson[] = [
  {
    id: 'sinh11-c92-b1',
    grade: '11',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG: Sinh lí thực vật và động vật',
    lessonNumber: 1,
    title: 'Ba con đường cố định CO₂: C3, C4 và CAM',
    hook:
      'Giữa trưa tháng sáu ở Ninh Thuận, ruộng lúa phải bơm nước liên tục mới giữ được màu xanh, ' +
      'trong khi luống thanh long trên đất cát ngay bên cạnh gần như không cần tưới. Nương ngô trên đồi ' +
      'cũng chịu nắng gắt tốt hơn lúa. Cả ba đều quang hợp và đều có chu trình Calvin. Vậy chỗ khác nhau ' +
      'nằm ở đâu mà sức chịu nóng khô lại chênh nhau đến thế?',
    theory:
      '## Điểm chung: mọi cây đều có chu trình Calvin\n' +
      'Ở cả ba nhóm, đường glucose cuối cùng đều do chu trình Calvin tạo ra, với enzyme Rubisco gắn CO₂ vào RuBP (5C). ' +
      'Mỗi CO₂ đi qua chu trình Calvin tốn 3 ATP và 2 NADPH. Vậy 1 glucose (6 CO₂) tốn 18 ATP và 12 NADPH. ' +
      'Ba nhóm C3, C4, CAM chỉ khác nhau ở khâu ĐƯA CO₂ tới Rubisco.\n\n' +
      '## Vì sao cần con đường phụ: điểm yếu của Rubisco\n' +
      'Rubisco vừa gắn được CO₂ (carboxylase), vừa gắn được O₂ (oxygenase). Khi trời nóng khô, khí khổng đóng để giữ nước. ' +
      'Lúc đó CO₂ trong lá cạn dần, còn O₂ do pha sáng thải ra lại tích lại. Rubisco gắn O₂ vào RuBP nhiều hơn, tạo ra ' +
      'glycolate (2C). Glycolate phải đi qua lục lạp, peroxisome và ti thể để được xử lí, và trên đường đi giải phóng lại CO₂ ' +
      'vừa cố định. Đó là HÔ HẤP SÁNG: tốn năng lượng mà không tạo ATP, làm hao hụt đáng kể sản phẩm quang hợp.\n\n' +
      '## Thực vật C3 (lúa, lúa mì, đậu, phần lớn rau)\n' +
      '— Chất nhận CO₂ đầu tiên: RuBP (5C), enzyme Rubisco. Sản phẩm đầu tiên: APG (3C), nên gọi là C3.\n' +
      '— Toàn bộ quang hợp diễn ra trong tế bào mô giậu. Hô hấp sáng mạnh khi nóng khô.\n' +
      '— Điểm bù CO₂ cao, khoảng 30–70 ppm.\n\n' +
      '## Thực vật C4 (ngô, mía, kê, cao lương)\n' +
      '— Chất nhận CO₂ đầu tiên: PEP (3C), enzyme PEP carboxylase. Sản phẩm đầu tiên: AOA (axit oxaloaxetic, 4C), nên gọi là C4.\n' +
      '— Tách biệt về KHÔNG GIAN. Ở tế bào mô giậu, PEP carboxylase gắn CO₂ thành AOA rồi malate. Malate chuyển sang tế bào ' +
      'bao bó mạch, nhả CO₂ cho chu trình Calvin. Đây là một cái "bơm" dồn CO₂ vào đúng chỗ có Rubisco.\n' +
      '— VÌ SAO hiệu quả: PEP carboxylase không gắn O₂ và bắt được CO₂ ở nồng độ rất thấp. Quanh Rubisco luôn đậm CO₂ nên hô hấp ' +
      'sáng gần như không còn. Điểm bù CO₂ rất thấp, khoảng 0–10 ppm.\n' +
      '— Cái giá phải trả: tái tạo PEP từ pyruvate tốn thêm 2 ATP cho mỗi CO₂. Một CO₂ tốn 5 ATP, nên 1 glucose tốn 30 ATP ' +
      '(NADPH vẫn là 12). Khi trời mát và đủ CO₂, khoản phí này làm C4 không còn lợi thế.\n\n' +
      '## Thực vật CAM (dứa, thanh long, xương rồng, nha đam)\n' +
      '— Cũng dùng PEP carboxylase, sản phẩm đầu tiên cũng là AOA. Nhưng tách biệt về THỜI GIAN, trong cùng một tế bào.\n' +
      '— Ban đêm trời mát, khí khổng mở: CO₂ được cố định thành malate, tích trong không bào, nên dịch bào chua dần về sáng.\n' +
      '— Ban ngày khí khổng đóng: malate nhả CO₂ cho chu trình Calvin chạy bằng ATP và NADPH của pha sáng.\n' +
      '— Đổi lại tiết kiệm nước tối đa, CAM có năng suất thấp vì lượng CO₂ cố định bị giới hạn bởi sức chứa của không bào.\n\n' +
      '## Vì sao C4 và CAM thích nghi với nóng khô\n' +
      'Cả hai đều có PEP carboxylase giữ CO₂ nên vẫn quang hợp được khi khí khổng khép bớt (C4) hoặc đóng hẳn ban ngày (CAM). ' +
      'Nhờ vậy, để tạo cùng một lượng chất khô, C4 mất ít nước hơn C3, còn CAM mất ít hơn nữa.\n\n' +
      '## Thí nghiệm phân biệt (dạng bài HSG hay gặp)\n' +
      '1. Chuông kín chung: đặt cây C3 và cây C4 trong cùng một chuông thuỷ tinh kín, chiếu sáng. CO₂ trong chuông giảm dần. ' +
      'Khi nồng độ xuống dưới điểm bù của cây C3, cây C3 quang hợp không bù nổi hô hấp, trong khi cây C4 vẫn hút tiếp. Cây C3 ' +
      'suy kiệt và chết trước.\n' +
      '2. Đo điểm bù: để riêng từng cây trong chuông kín, đo nồng độ CO₂ ổn định cuối cùng. Cây nào hạ được CO₂ xuống gần 0 là C4.\n' +
      '3. Tăng O₂ từ 21% lên cao: quang hợp của cây C3 giảm rõ, cây C4 gần như không đổi.\n' +
      '4. Đo độ chua dịch bào sáng và chiều, hoặc xem khí khổng mở lúc nào: chua về sáng, khí khổng mở đêm là CAM.\n\n' +
      'BẪY HAY GẶP: (1) Nghĩ "cây nhiệt đới thì là C4". Lúa là cây nhiệt đới nhưng vẫn là C3. (2) Nghĩ C4 và CAM không có chu ' +
      'trình Calvin. Thực ra cả hai đều có, chúng chỉ thêm một bước gom CO₂ phía trước. (3) Nhầm CAM tách biệt về không gian. ' +
      'C4 tách theo không gian, CAM tách theo thời gian.',
    workedExample: {
      problem:
        'Một nhóm học sinh có ba chậu cây X, Y, Z chưa rõ tên. Các em đặt riêng từng cây vào một chuông kín, chiếu sáng đều, ' +
        'và đo được: chuông X, CO₂ giảm rồi dừng ở khoảng 55 ppm; chuông Y, CO₂ giảm tới khoảng 5 ppm; với cây Z, khí khổng ' +
        'mở chủ yếu ban đêm, dịch bào lúc 6 giờ sáng chua hơn hẳn lúc 5 giờ chiều. Hãy xác định nhóm quang hợp của mỗi cây.',
      steps: [
        'Bước 1 — Hiểu con số đo được trong chuông kín. CO₂ dừng giảm khi lượng CO₂ cây hấp thụ bằng lượng thải ra. Đó chính là điểm bù CO₂, vì vậy dùng nó để so sánh khả năng giữ CO₂ của từng cây.',
        'Bước 2 — Cây X dừng ở khoảng 55 ppm, nằm trong khoảng 30–70 ppm của cây C3. Lí do: Rubisco vừa gắn O₂ vừa gắn CO₂, hô hấp sáng mạnh nên cây không kéo CO₂ xuống thấp hơn được. Kết luận X là cây C3.',
        'Bước 3 — Cây Y hạ CO₂ xuống khoảng 5 ppm. Chỉ PEP carboxylase, với ái lực rất cao với CO₂ và không gắn O₂, mới làm được điều này. Kết luận Y là cây C4.',
        'Bước 4 — Cây Z mở khí khổng ban đêm và dịch bào chua về sáng. Ban đêm cây cố định CO₂ thành malate, tích trong không bào, nên sáng sớm dịch bào chua nhất. Ban ngày malate được dùng dần nên chiều bớt chua. Kết luận Z là cây CAM.',
        'Bước 5 — Tự kiểm bằng một dự đoán. Nếu đặt X và Y chung một chuông, Y sẽ kéo CO₂ xuống dưới 55 ppm, X lỗ carbon và suy kiệt trước. Dự đoán này khớp với kết luận X là C3, Y là C4.',
      ],
      answer: 'X là cây C3, Y là cây C4, Z là cây CAM.',
    },
    checkQuestions: [
      {
        prompt:
          'Đặt một cây lúa và một cây ngô trong cùng một chuông thuỷ tinh kín, chiếu sáng liên tục, đủ nước và khoáng. Sau một thời gian dài, điều gì xảy ra?',
        choices: [
          {
            id: 'ck_1',
            label: 'Cây ngô chết trước vì cây C4 cần nhiều CO₂ hơn cây C3',
          },
          {
            id: 'ck_2',
            label: 'Cây lúa chết trước vì cây ngô kéo CO₂ xuống dưới điểm bù CO₂ của cây lúa',
          },
          { id: 'ck_3', label: 'Hai cây chết cùng lúc vì cùng hết CO₂' },
          {
            id: 'ck_4',
            label: 'Hai cây sống mãi vì O₂ do chúng thải ra đủ cho hô hấp',
          },
        ],
        answer: { kind: 'choice', correctIds: ['ck_2'] },
        explain:
          'Ngô là cây C4, điểm bù CO₂ chỉ khoảng 0–10 ppm. Lúa là cây C3, điểm bù khoảng 30–70 ppm. Khi CO₂ trong chuông tụt dưới điểm bù của lúa, lúa quang hợp không bù nổi hô hấp và bị lỗ carbon, còn ngô vẫn hút tiếp. ' +
          'Lỗi hay gặp là nghĩ cây C4 "cần" nhiều CO₂. Thực ra cây C4 bắt CO₂ giỏi hơn, nên chịu được CO₂ thấp hơn.',
      },
      {
        prompt:
          'Chu trình Calvin ở thực vật C3 cần bao nhiêu phân tử ATP để tổng hợp 1 phân tử glucose? (Nhập một số nguyên.)',
        answer: { kind: 'numeric', value: 18 },
        explain:
          'Mỗi CO₂ đi qua chu trình Calvin tốn 3 ATP và 2 NADPH. Glucose có 6C nên cần 6 lượt cố định CO₂: 6 × 3 = 18 ATP, kèm 6 × 2 = 12 NADPH. ' +
          'Lỗi hay gặp là đếm cho 1 CO₂ (3 ATP) rồi quên nhân 6, hoặc nhầm ATP với NADPH.',
      },
      {
        prompt:
          'Để tổng hợp 2 phân tử glucose, cây C4 tốn NHIỀU HƠN cây C3 bao nhiêu phân tử ATP? (Nhập một số nguyên.)',
        answer: { kind: 'numeric', value: 24 },
        explain:
          'Cây C4 tốn thêm 2 ATP cho mỗi CO₂ để tái tạo PEP từ pyruvate, tức 5 ATP mỗi CO₂ so với 3 ATP ở C3. Một glucose cần 6 CO₂, nên tốn thêm 6 × 2 = 12 ATP (30 so với 18). Hai glucose tốn thêm 2 × 12 = 24 ATP. ' +
          'Bẫy hay gặp là chỉ tính cho 1 glucose (12), hoặc trả lời tổng số ATP của cây C4 (60) thay vì phần chênh lệch.',
      },
      {
        prompt: 'Phát biểu nào sau đây về quang hợp ở cây dứa (thực vật CAM) là ĐÚNG?',
        choices: [
          {
            id: 'cam_1',
            label: 'Cây dứa không có chu trình Calvin, chỉ có con đường cố định CO₂ bằng PEP',
          },
          {
            id: 'cam_2',
            label:
              'Ban đêm CO₂ được cố định thành malate tích trong không bào; ban ngày khí khổng đóng, malate nhả CO₂ cho chu trình Calvin',
          },
          {
            id: 'cam_3',
            label: 'Hai giai đoạn cố định CO₂ diễn ra ở hai loại tế bào khác nhau trong lá',
          },
          { id: 'cam_4', label: 'Ban ngày khí khổng mở to để lấy đủ CO₂ cho chu trình Calvin' },
        ],
        answer: { kind: 'choice', correctIds: ['cam_2'] },
        explain:
          'CAM tách hai giai đoạn theo THỜI GIAN trong cùng một tế bào. Ban đêm cây cố định CO₂ bằng PEP carboxylase và cất malate vào không bào. Ban ngày khí khổng đóng để giữ nước, malate nhả CO₂ cho chu trình Calvin. ' +
          'Tách theo hai loại tế bào là đặc điểm của C4, không phải CAM. Và mọi nhóm cây đều có chu trình Calvin.',
      },
    ],
    srsCards: [
      {
        hoi: 'Chất nhận CO₂ đầu tiên và sản phẩm đầu tiên ở C3, C4, CAM?',
        dap: 'C3: chất nhận RuBP (5C), sản phẩm APG (3C). C4 và CAM: chất nhận PEP (3C), enzyme PEP carboxylase, sản phẩm AOA (4C).',
      },
      {
        hoi: 'C4 và CAM khác nhau ở cách tách hai giai đoạn cố định CO₂ thế nào?',
        dap: 'C4 tách theo KHÔNG GIAN: mô giậu cố định CO₂, bao bó mạch chạy chu trình Calvin. CAM tách theo THỜI GIAN: đêm cố định CO₂, ngày chạy chu trình Calvin, trong cùng một tế bào.',
      },
      {
        hoi: 'Số ATP và NADPH để tạo 1 glucose ở C3 và C4?',
        dap: 'C3: 18 ATP và 12 NADPH. C4: 30 ATP và 12 NADPH, vì mỗi CO₂ tốn thêm 2 ATP để tái tạo PEP.',
      },
      {
        hoi: 'Vì sao cây C4 có điểm bù CO₂ thấp hơn cây C3?',
        dap: 'PEP carboxylase không gắn O₂ và bắt CO₂ ở nồng độ rất thấp, rồi dồn CO₂ vào bao bó mạch. Rubisco luôn đủ CO₂ nên hô hấp sáng gần như không còn.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c92-b2',
    grade: '11',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG: Sinh lí thực vật và động vật',
    lessonNumber: 2,
    title: 'Chu kì tim, lưu lượng tim và vận tốc máu: bài toán định lượng',
    hook:
      'Chạy bộ buổi sáng quanh hồ, chiếc đồng hồ thông minh báo nhịp tim của bạn từ 70 vọt lên 150 lần/phút. ' +
      'Tim đập nhanh gấp đôi, vậy mỗi nhịp có còn kịp bơm đầy máu không? Và vì sao một trái tim đập không nghỉ ' +
      'suốt mấy chục năm lại không mỏi? Câu trả lời nằm ở cách tim chia thời gian của từng chu kì.',
    theory:
      '## Chu kì tim: chia thời gian giữa làm và nghỉ\n' +
      'Ở người trưởng thành lúc nghỉ, nhịp tim khoảng 75 lần/phút. Một chu kì kéo dài 60 : 75 = 0,8 s, gồm ba pha nối tiếp:\n' +
      '— Tâm nhĩ co: 0,1 s, đẩy nốt phần máu cuối cùng xuống tâm thất.\n' +
      '— Tâm thất co: 0,3 s, đẩy máu vào động mạch.\n' +
      '— Dãn chung: 0,4 s, máu từ tĩnh mạch về đầy tâm nhĩ và tâm thất.\n' +
      'Tỉ lệ ba pha là 1 : 3 : 4. Trong mỗi chu kì, tâm nhĩ co 0,1 s và nghỉ 0,7 s; tâm thất co 0,3 s và nghỉ 0,5 s. ' +
      'VÌ SAO tim không mỏi: thời gian nghỉ của mỗi ngăn luôn dài hơn thời gian làm việc, đủ để phục hồi.\n' +
      'Nhịp tim tính bằng 60 chia cho thời gian một chu kì (giây). Muốn tính thời gian một pha, lấy thời gian chu kì nhân với phần ' +
      'của pha đó trong tổng tỉ lệ.\n\n' +
      'GIỚI HẠN của tỉ lệ trên — khi nhịp tim tăng, thực tế pha dãn chung bị rút ngắn nhiều nhất, còn pha co gần như giữ nguyên. ' +
      'Đề bài chỉ được giả sử tỉ lệ không đổi khi đề nói rõ điều đó. Nhịp quá nhanh làm thời gian dãn quá ngắn, tâm thất không kịp ' +
      'đầy máu và mỗi nhát bóp bơm được ít đi.\n\n' +
      '## Lưu lượng tim\n' +
      'Lưu lượng tim là thể tích máu một tâm thất bơm đi trong một phút: Q = nhịp tim × thể tích tâm thu. ' +
      'Thể tích tâm thu là lượng máu tâm thất tống đi trong một lần co, ở người lúc nghỉ khoảng 70 mL. ' +
      'Ví dụ 75 × 70 mL = 5250 mL, tức khoảng 5,25 L/phút.\n' +
      'Hệ quả hay ra đề: vận động viên tập luyện lâu năm có tim khoẻ, thể tích tâm thu lớn, nên lúc nghỉ chỉ cần nhịp tim thấp ' +
      'mà vẫn đủ lưu lượng.\n\n' +
      '## Huyết áp\n' +
      '— Huyết áp là áp lực máu tác dụng lên thành mạch. Huyết áp tâm thu ứng với lúc tâm thất co, huyết áp tâm trương ứng với lúc ' +
      'tâm thất dãn. Ở người trưởng thành khoẻ mạnh, khoảng 110–120 / 70–80 mmHg.\n' +
      '— Huyết áp giảm dần từ động mạch chủ, qua động mạch nhỏ, mao mạch, tĩnh mạch, tới gần bằng 0 ở tĩnh mạch chủ. VÌ SAO: ' +
      'máu ma sát với thành mạch và các phần tử máu ma sát với nhau, năng lượng do tim cung cấp mất dần trên đường đi.\n' +
      '— Huyết áp tăng khi tim đập nhanh và mạnh, khi khối lượng máu tăng, khi máu quánh hơn, hoặc khi thành mạch kém đàn hồi.\n\n' +
      '## Vận tốc máu tỉ lệ nghịch với tổng tiết diện\n' +
      'Máu chảy trong một hệ khép kín, nên mỗi giây lượng máu qua mọi cấp mạch đều bằng nhau và bằng lưu lượng tim. Vì vậy ' +
      'Q = v × S, trong đó S là TỔNG tiết diện của mọi mạch cùng cấp. Suy ra v = Q : S.\n' +
      '— Động mạch chủ chỉ có một ống, tổng tiết diện nhỏ, nên máu chảy nhanh nhất, khoảng 500 mm/s.\n' +
      '— Mao mạch tuy rất nhỏ nhưng có hàng tỉ cái, tổng tiết diện lớn nhất, nên máu chảy chậm nhất, khoảng 0,5 mm/s. ' +
      'Chảy chậm cho máu đủ thời gian trao đổi chất với tế bào.\n' +
      '— Khi các tĩnh mạch nhập lại, tổng tiết diện giảm, vận tốc tăng trở lại, khoảng 200 mm/s ở tĩnh mạch chủ.\n\n' +
      'BẪY HAY GẶP: (1) Cho rằng huyết áp và vận tốc máu giảm vì cùng một lí do. Huyết áp giảm dần đều trên cả đường đi, còn vận ' +
      'tốc phụ thuộc tổng tiết diện, nên vận tốc tăng lại ở tĩnh mạch dù huyết áp vẫn tiếp tục giảm. (2) Lấy tiết diện của MỘT ' +
      'mao mạch để tính. Phải dùng tổng tiết diện. (3) Quên đổi đơn vị: 1 L = 1000 cm³, 1 cm = 10 mm, 1 phút = 60 s.',
    workedExample: {
      problem:
        'Một người có nhịp tim 75 lần/phút, các pha tâm nhĩ co, tâm thất co, dãn chung kéo dài lần lượt 0,1 s; 0,3 s; 0,4 s. ' +
        'Mỗi lần tâm thất co tống đi 70 mL máu. Tính: a) thời gian nghỉ của tâm nhĩ và của tâm thất trong một chu kì; ' +
        'b) tổng thời gian tâm thất nghỉ trong một ngày đêm (theo giờ); c) lưu lượng tim (theo L/phút).',
      steps: [
        'Bước 1 — Kiểm dữ kiện trước khi dùng. Nhịp 75 lần/phút cho chu kì 60 : 75 = 0,8 s. Tổng ba pha là 0,1 + 0,3 + 0,4 = 0,8 s, khớp. Kiểm bước này để chắc đề nhất quán, không tính trên số sai.',
        'Bước 2 — Thời gian nghỉ. Tâm nhĩ chỉ co 0,1 s nên nghỉ 0,8 − 0,1 = 0,7 s. Tâm thất co 0,3 s nên nghỉ 0,8 − 0,3 = 0,5 s. Lưu ý thời gian nghỉ của tâm thất gồm cả pha tâm nhĩ co, vì lúc đó tâm thất đang dãn.',
        'Bước 3 — Số chu kì trong một ngày đêm: 75 × 60 × 24 = 108 000 chu kì. Lí do nhân như vậy: 75 chu kì mỗi phút, 60 phút mỗi giờ, 24 giờ mỗi ngày.',
        'Bước 4 — Thời gian tâm thất nghỉ: 108 000 × 0,5 = 54 000 s. Đổi ra giờ: 54 000 : 3600 = 15 giờ.',
        'Bước 5 — Tự kiểm bằng tỉ lệ. Tâm thất nghỉ 0,5 : 0,8 = 5/8 thời gian, và 5/8 × 24 giờ = 15 giờ. Hai cách cho cùng kết quả.',
        'Bước 6 — Lưu lượng tim: Q = 75 × 70 = 5250 mL/phút = 5,25 L/phút.',
      ],
      answer:
        'a) Tâm nhĩ nghỉ 0,7 s, tâm thất nghỉ 0,5 s; b) tâm thất nghỉ 15 giờ mỗi ngày đêm; c) Q = 5,25 L/phút.',
    },
    checkQuestions: [
      {
        prompt:
          'Một người có nhịp tim 60 lần/phút. Giả sử tỉ lệ thời gian tâm nhĩ co : tâm thất co : dãn chung vẫn là 1 : 3 : 4. Thời gian tâm thất co trong một chu kì là bao nhiêu giây? (Ghi số thập phân, ví dụ 0,5.)',
        answer: { kind: 'numeric', value: 0.375, tolerance: { mode: 'absolute', eps: 0.001 } },
        explain:
          'Nhịp 60 lần/phút cho chu kì 60 : 60 = 1 s. Tổng tỉ lệ là 1 + 3 + 4 = 8 phần, tâm thất co chiếm 3 phần: 1 × 3/8 = 0,375 s. ' +
          'Lỗi hay gặp là giữ nguyên 0,3 s của nhịp 75, hoặc chia cho 3 phần thay vì 8 phần. Lưu ý thực tế pha dãn mới là pha bị co giãn nhiều nhất.',
      },
      {
        prompt:
          'Một học sinh có nhịp tim lúc nghỉ 72 lần/phút, mỗi lần tâm thất co tống đi 70 mL máu. Lưu lượng tim của học sinh này là bao nhiêu lít/phút? (Ghi số thập phân, làm tròn đến hai chữ số sau dấu phẩy.)',
        answer: { kind: 'numeric', value: 5.04, tolerance: { mode: 'absolute', eps: 0.01 } },
        explain:
          'Q = nhịp tim × thể tích tâm thu = 72 × 70 = 5040 mL/phút. Đổi sang lít bằng cách chia 1000, được 5,04 L/phút. ' +
          'Lỗi hay gặp là quên đổi mL sang L (ghi 5040), hoặc chia cho 60 vì nhầm sang lít mỗi giây.',
      },
      {
        prompt:
          'Trên đường máu đi từ mao mạch về tĩnh mạch chủ, huyết áp tiếp tục giảm nhưng vận tốc máu lại tăng lên. Giải thích nào ĐÚNG?',
        choices: [
          {
            id: 'vt_1',
            label: 'Vì tĩnh mạch có van nên đẩy máu chảy nhanh hơn động mạch',
          },
          {
            id: 'vt_2',
            label:
              'Vì các tĩnh mạch nhập lại làm tổng tiết diện giảm; lưu lượng qua mỗi cấp mạch không đổi nên vận tốc tăng',
          },
          { id: 'vt_3', label: 'Vì huyết áp thấp thì máu chảy nhanh hơn' },
          { id: 'vt_4', label: 'Vì tĩnh mạch có thành dày hơn mao mạch nên ma sát ít hơn' },
        ],
        answer: { kind: 'choice', correctIds: ['vt_2'] },
        explain:
          'Lưu lượng máu qua mọi cấp mạch bằng nhau: Q = v × S. Từ mao mạch về tĩnh mạch, tổng tiết diện S giảm dần nên v phải tăng. ' +
          'Huyết áp và vận tốc do hai yếu tố khác nhau quyết định, vì thế chúng có thể đi ngược chiều nhau. Van tĩnh mạch chỉ ngăn máu chảy ngược, không làm máu nhanh lên.',
      },
      {
        prompt:
          'Lưu lượng máu qua hệ mạch của một người là 80 cm³/s. Tổng tiết diện của toàn bộ mao mạch là 3200 cm². Vận tốc máu trong mao mạch là bao nhiêu mm/s? (Ghi số thập phân.)',
        answer: { kind: 'numeric', value: 0.25, tolerance: { mode: 'absolute', eps: 0.005 } },
        explain:
          'v = Q : S = 80 : 3200 = 0,025 cm/s. Đổi sang mm/s bằng cách nhân 10, được 0,25 mm/s. ' +
          'Lỗi hay gặp là quên đổi cm sang mm (ghi 0,025), hoặc dùng tiết diện của một mao mạch thay cho tổng tiết diện của cả lưới mao mạch.',
      },
    ],
    srsCards: [
      {
        hoi: 'Chu kì tim người lúc nhịp 75 lần/phút gồm những pha nào, dài bao lâu?',
        dap: 'Chu kì 0,8 s: tâm nhĩ co 0,1 s, tâm thất co 0,3 s, dãn chung 0,4 s (tỉ lệ 1 : 3 : 4). Tâm nhĩ nghỉ 0,7 s, tâm thất nghỉ 0,5 s.',
      },
      {
        hoi: 'Công thức lưu lượng tim?',
        dap: 'Q = nhịp tim × thể tích tâm thu. Ví dụ 75 lần/phút × 70 mL = 5250 mL/phút ≈ 5,25 L/phút.',
      },
      {
        hoi: 'Vì sao máu chảy chậm nhất ở mao mạch?',
        dap: 'Vì Q = v × S với Q không đổi qua mọi cấp mạch, mà mao mạch có tổng tiết diện lớn nhất nên v nhỏ nhất. Chảy chậm giúp trao đổi chất với tế bào.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c92-b3',
    grade: '11',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG: Sinh lí thực vật và động vật',
    lessonNumber: 3,
    title: 'Điện thế nghỉ, điện thế hoạt động và phương trình Nernst',
    hook:
      'Đi nhổ răng, bạn được tiêm một mũi thuốc tê. Vài phút sau nửa môi tê dại: nha sĩ chạm vào mà bạn ' +
      'không thấy gì, dù dây thần kinh vẫn còn nguyên. Thuốc tê không cắt dây thần kinh. Nó chỉ chặn một loại ' +
      'kênh ion bé xíu trên màng tế bào thần kinh. Hiểu loại kênh đó là hiểu xung thần kinh được tạo ra thế nào.',
    theory:
      '## Điện thế nghỉ: vì sao trong màng âm\n' +
      'Lúc nghỉ, mặt trong màng tế bào thần kinh âm hơn mặt ngoài khoảng 70 mV (điện thế nghỉ khoảng −70 mV). Ba nguyên nhân:\n' +
      '1. Ion phân bố không đều: K⁺ trong tế bào nhiều gấp khoảng 30 lần ngoài tế bào, còn Na⁺ thì ngược lại, ngoài nhiều hơn trong.\n' +
      '2. Lúc nghỉ, màng thấm K⁺ tốt hơn hẳn Na⁺ nhờ các kênh K⁺ luôn mở (kênh rò). K⁺ đi ra theo chênh lệch nồng độ, mang điện ' +
      'dương ra ngoài, còn các anion lớn (protein) không ra được nên ở lại làm mặt trong âm.\n' +
      '3. Bơm Na-K dùng ATP, mỗi lượt đưa 3 Na⁺ ra và 2 K⁺ vào. Vai trò chính của bơm là GIỮ chênh lệch nồng độ lâu dài; phần ' +
      'điện thế do chính bơm tạo ra trực tiếp chỉ vài mV.\n\n' +
      '## Phương trình Nernst: điện thế cân bằng của một ion\n' +
      'K⁺ ra ngoài theo nồng độ, nhưng càng ra thì mặt trong càng âm và hút K⁺ ngược lại. Tới một điện thế nào đó, hai lực cân ' +
      'bằng: đó là điện thế cân bằng của ion. Ở 37 °C:\n' +
      'E = (61 / z) · log₁₀([ion]ngoài / [ion]trong) (mV), trong đó z là hoá trị của ion có kèm dấu.\n' +
      '— K⁺ (z = +1), ngoài 5 mM, trong 140 mM: E_K ≈ 61 · log₁₀(5/140) ≈ −88 mV.\n' +
      '— Na⁺ (z = +1), ngoài 145 mM, trong 15 mM: E_Na ≈ +60 mV.\n' +
      'Điện thế nghỉ −70 mV nằm gần E_K nhưng không bằng: màng vẫn rò một ít Na⁺ vào, kéo điện thế lên phía dương. Quy tắc: ' +
      'màng thấm ion nào nhiều nhất thì điện thế màng tiến gần điện thế cân bằng của ion đó.\n\n' +
      '## Điện thế hoạt động: các pha\n' +
      '— Khử cực: kích thích làm màng bớt âm. Khi tới ngưỡng (khoảng −55 mV), kênh Na⁺ cổng điện thế mở ồ ạt. Na⁺ tràn vào làm ' +
      'màng càng khử cực, kéo thêm nhiều kênh Na⁺ mở nữa. Đây là vòng phản hồi dương.\n' +
      '— Đảo cực: điện thế vượt qua 0 lên khoảng +30 mV. Nó không chạm tới E_Na vì kênh Na⁺ tự bất hoạt rất nhanh.\n' +
      '— Tái phân cực: kênh Na⁺ bất hoạt, kênh K⁺ cổng điện thế mở chậm, K⁺ đi ra, điện thế quay về âm.\n' +
      '— Tăng phân cực: kênh K⁺ đóng chậm nên màng tụt quá mức nghỉ, tiến về gần E_K, rồi trở lại −70 mV.\n' +
      'Điện thế hoạt động theo quy luật "tất cả hoặc không": dưới ngưỡng thì không phát, đạt ngưỡng thì biên độ luôn như nhau. ' +
      'Cường độ kích thích mạnh hay yếu được mã hoá bằng TẦN SỐ xung, không bằng độ cao xung.\n' +
      'Lượng ion qua màng trong một xung rất nhỏ so với lượng ion trong tế bào. Vì vậy, nếu chặn bơm Na-K, nơron vẫn phát được ' +
      'rất nhiều xung trước khi chênh lệch nồng độ cạn dần.\n\n' +
      '## Thời kì trơ\n' +
      '— Trơ tuyệt đối: lúc kênh Na⁺ đang mở hoặc đang bất hoạt, kích thích mạnh đến đâu cũng không tạo được xung mới.\n' +
      '— Trơ tương đối: trong pha tăng phân cực, cần kích thích mạnh hơn bình thường mới phát được xung.\n' +
      'Ý nghĩa: đoạn màng vừa phát xung đang trơ nên xung không quay ngược lại, chỉ đi một chiều. Thời kì trơ cũng đặt giới hạn ' +
      'trên cho tần số xung.\n\n' +
      '## Dẫn truyền nhảy cóc\n' +
      'Ở sợi có bao myelin, myelin cách điện. Kênh Na⁺ tập trung ở eo Ranvier, nên điện thế hoạt động chỉ phát ở các eo và nhảy ' +
      'từ eo này sang eo kế tiếp. Kết quả: dẫn truyền nhanh hơn nhiều lần so với sợi không myelin cùng đường kính, và tốn ít ' +
      'năng lượng hơn vì chỉ có màng ở eo phải trao đổi ion.\n\n' +
      'BẪY HAY GẶP: (1) Quên hoá trị z, ví dụ Ca²⁺ có z = 2 nên hệ số là 61/2. (2) Đảo ngược tỉ số trong log: luôn là ngoài ' +
      'chia trong, kết quả âm hay dương phải khớp với chiều ion muốn đi. (3) Nghĩ bơm Na-K tạo ra đỉnh xung. Đỉnh xung do kênh ' +
      'Na⁺ mở, bơm chỉ giữ nồng độ lâu dài.',
    workedExample: {
      problem:
        'Một nơron ở 37 °C có [K⁺] trong 140 mM, ngoài 5 mM. Đo được điện thế nghỉ −70 mV. ' +
        'a) Tính E_K. b) So sánh E_K với điện thế nghỉ và giải thích chỗ chênh. ' +
        'c) Nếu tăng [K⁺] ngoài lên 10 mM, E_K thay đổi bao nhiêu mV và điện thế nghỉ thay đổi theo chiều nào?',
      steps: [
        'Bước 1 — Chọn công thức. Đề hỏi điện thế cân bằng của một ion ở 37 °C, nên dùng E = (61/z) · log₁₀([ngoài]/[trong]) với z = +1 cho K⁺.',
        'Bước 2 — Tính E_K = 61 · log₁₀(5/140). Ta có 5/140 ≈ 0,0357 và log₁₀(0,0357) ≈ −1,447. Vậy E_K ≈ 61 × (−1,447) ≈ −88,3 mV.',
        'Bước 3 — Tự kiểm dấu. K⁺ đậm hơn ở trong nên có xu hướng đi ra, để lại mặt trong âm. E_K âm là đúng chiều.',
        'Bước 4 — So sánh. Điện thế nghỉ −70 mV kém âm hơn E_K khoảng 18 mV. Lí do: màng lúc nghỉ chủ yếu thấm K⁺ nhưng vẫn rò một ít Na⁺ vào trong, kéo điện thế lên phía dương.',
        'Bước 5 — Khi [K⁺] ngoài tăng gấp đôi, từ 5 lên 10 mM: E_K mới = 61 · log₁₀(10/140) ≈ −69,9 mV. Độ thay đổi là 61 · log₁₀2 ≈ +18,4 mV. Tính hiệu bằng log₁₀2 nhanh hơn và ít sai hơn tính lại từ đầu.',
        'Bước 6 — Kết luận chiều thay đổi. E_K bớt âm, mà điện thế nghỉ phụ thuộc chủ yếu vào E_K, nên điện thế nghỉ cũng bớt âm. Màng bị khử cực một phần và tiến gần ngưỡng hơn.',
      ],
      answer:
        'a) E_K ≈ −88,3 mV; b) điện thế nghỉ kém âm hơn E_K vì màng rò một ít Na⁺; c) E_K tăng khoảng 18,4 mV (thành ≈ −69,9 mV), điện thế nghỉ bớt âm (màng bị khử cực).',
    },
    checkQuestions: [
      {
        prompt:
          'Ở 37 °C, một tế bào có [K⁺] trong 150 mM và [K⁺] ngoài 5 mM. Dùng E = (61/z) · log₁₀([ngoài]/[trong]), tính E_K theo mV. (Ghi cả dấu, làm tròn đến một chữ số thập phân.)',
        answer: { kind: 'numeric', value: -90.1, tolerance: { mode: 'absolute', eps: 0.2 } },
        explain:
          'E_K = 61 · log₁₀(5/150) = 61 · log₁₀(1/30) ≈ 61 × (−1,477) ≈ −90,1 mV. Kết quả âm vì K⁺ đậm ở trong, đi ra và để lại mặt trong âm. ' +
          'Lỗi hay gặp là đảo tỉ số thành trong chia ngoài, ra +90,1 mV, sai dấu.',
      },
      {
        prompt:
          'Ở 37 °C, nồng độ Ca²⁺ ngoài tế bào là 2 mM, trong bào tương là 0,0002 mM. Tính điện thế cân bằng E_Ca theo mV. (Nhập một số nguyên.)',
        answer: { kind: 'numeric', value: 122 },
        explain:
          'Ca²⁺ có z = 2 nên hệ số là 61/2 = 30,5. Tỉ số ngoài/trong = 2 : 0,0002 = 10 000, nên log₁₀ = 4. E_Ca = 30,5 × 4 = +122 mV. ' +
          'Lỗi hay gặp là quên chia hoá trị, ra 244 mV. E_Ca dương vì Ca²⁺ đậm ở ngoài và có xu hướng đi vào.',
      },
      {
        prompt:
          'Tăng nồng độ K⁺ trong dịch ngoài bào của một nơron (các yếu tố khác giữ nguyên). Dự đoán nào ĐÚNG về điện thế nghỉ?',
        choices: [
          {
            id: 'k_1',
            label: 'Điện thế nghỉ âm hơn (tăng phân cực) vì có thêm ion dương ở ngoài',
          },
          {
            id: 'k_2',
            label:
              'Điện thế nghỉ bớt âm (khử cực một phần) vì chênh lệch K⁺ giữa trong và ngoài giảm, K⁺ đi ra ít hơn',
          },
          { id: 'k_3', label: 'Điện thế nghỉ không đổi vì bơm Na-K bù lại ngay lập tức' },
          { id: 'k_4', label: 'Điện thế nghỉ đảo dấu thành dương' },
        ],
        answer: { kind: 'choice', correctIds: ['k_2'] },
        explain:
          'Điện thế nghỉ bám theo E_K vì màng nghỉ thấm K⁺ nhiều nhất. Tăng [K⁺] ngoài làm tỉ số ngoài/trong lớn lên, nên E_K bớt âm và điện thế nghỉ cũng bớt âm. ' +
          'Lỗi hay gặp là nghĩ "thêm ion dương ở ngoài thì trong càng âm". Thực tế điều quyết định là chênh lệch nồng độ, không phải số điện tích ngoài.',
      },
      {
        prompt:
          'Vì sao điện thế hoạt động trên sợi trục chỉ lan truyền theo một chiều, rời xa nơi vừa phát xung?',
        choices: [
          {
            id: 'tr_1',
            label:
              'Vì đoạn màng vừa phát xung đang ở thời kì trơ, kênh Na⁺ còn bất hoạt nên không phát lại được',
          },
          { id: 'tr_2', label: 'Vì bao myelin chỉ cho dòng điện chạy theo một chiều' },
          { id: 'tr_3', label: 'Vì bơm Na-K đẩy xung về phía trước' },
          { id: 'tr_4', label: 'Vì kênh K⁺ chỉ có ở phía trước điểm phát xung' },
        ],
        answer: { kind: 'choice', correctIds: ['tr_1'] },
        explain:
          'Dòng điện cục bộ lan ra cả hai phía, nhưng đoạn màng phía sau vừa phát xung có kênh Na⁺ đang bất hoạt (trơ tuyệt đối), nên không phát lại được. Chỉ đoạn màng phía trước còn kích thích được. ' +
          'Myelin cách điện để xung nhảy cóc nhanh hơn, không quyết định chiều. Bơm Na-K chỉ giữ nồng độ lâu dài.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương trình Nernst ở 37 °C?',
        dap: 'E = (61/z) · log₁₀([ion]ngoài / [ion]trong) mV, z là hoá trị có dấu. Ví dụ E_K ≈ −88 mV, E_Na ≈ +60 mV.',
      },
      {
        hoi: 'Kênh nào gây khử cực, kênh nào gây tái phân cực trong điện thế hoạt động?',
        dap: 'Khử cực và đảo cực: kênh Na⁺ cổng điện thế mở, Na⁺ vào. Tái phân cực: kênh Na⁺ bất hoạt, kênh K⁺ cổng điện thế mở, K⁺ ra. Kênh K⁺ đóng chậm gây tăng phân cực.',
      },
      {
        hoi: 'Vì sao điện thế nghỉ (−70 mV) không bằng E_K (khoảng −88 mV)?',
        dap: 'Màng nghỉ thấm K⁺ nhiều nhất nhưng vẫn rò một ít Na⁺ vào, kéo điện thế lên phía dương so với E_K.',
      },
      {
        hoi: 'Dẫn truyền nhảy cóc là gì, lợi gì?',
        dap: 'Ở sợi có myelin, xung chỉ phát ở eo Ranvier (nơi tập trung kênh Na⁺) và nhảy từ eo này sang eo khác. Nhanh hơn và tốn ít năng lượng hơn sợi không myelin.',
      },
    ],
    animation: {
      title: 'Điện thế màng theo thời gian khi phát một xung thần kinh',
      description:
        'Đồ thị điện thế màng (trục đứng, mV) theo thời gian (trục ngang) tại một điểm trên sợi trục. Một chấm tròn chạy dọc đường cong. ' +
        'Lúc đầu chấm nằm ngang ở mức nghỉ −70 mV. Một mũi tên kích thích xuất hiện, chấm nhích lên tới đường nét đứt ngưỡng −55 mV. ' +
        'Từ đó chấm vọt lên rất dốc, vượt qua 0 tới đỉnh khoảng +30 mV: đây là pha khử cực và đảo cực do Na⁺ tràn vào. ' +
        'Sau đỉnh, chấm đi xuống: pha tái phân cực do K⁺ đi ra. Chấm tụt xuống dưới mức nghỉ, khoảng −80 mV, là pha tăng phân cực ' +
        'vì kênh K⁺ đóng chậm, rồi từ từ trở về −70 mV. Nhãn tên từng pha hiện ra đúng lúc chấm đi qua pha đó.',
      viewBoxWidth: 460,
      viewBoxHeight: 260,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'lb-tieude',
          x: 230,
          y: 18,
          text: 'Điện thế màng tại một điểm trên sợi trục',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'truc-dung',
          x1: 50,
          y1: 34,
          x2: 50,
          y2: 230,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-ngang',
          x1: 50,
          y1: 230,
          x2: 445,
          y2: 230,
          stroke: 'muted',
          strokeWidth: 2,
        },
        { kind: 'label', id: 'lb-mv', x: 56, y: 40, text: 'mV', size: 10, fill: 'neutral' },
        {
          kind: 'label',
          id: 'lb-thoigian',
          x: 445,
          y: 250,
          text: 'thời gian',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-p30',
          x: 44,
          y: 66,
          text: '+30',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-0',
          x: 44,
          y: 102,
          text: '0',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-m70',
          x: 44,
          y: 186,
          text: '−70',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'muc-0',
          x1: 50,
          y1: 98,
          x2: 445,
          y2: 98,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '2 4',
        },
        {
          kind: 'line',
          id: 'nguong',
          x1: 50,
          y1: 164,
          x2: 445,
          y2: 164,
          stroke: 'warn',
          strokeWidth: 1.5,
          dash: '5 4',
        },
        {
          kind: 'label',
          id: 'lb-nguong',
          x: 445,
          y: 158,
          text: 'ngưỡng −55',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'duong-cong',
          points: [
            [60, 182],
            [120, 182],
            [140, 164],
            [150, 110],
            [160, 62],
            [175, 70],
            [195, 120],
            [215, 182],
            [240, 194],
            [280, 188],
            [320, 182],
            [440, 182],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
        },
        {
          kind: 'arrow',
          id: 'kich-thich',
          x1: 120,
          y1: 224,
          x2: 120,
          y2: 198,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 800, opacity: 0 },
            { atMs: 1000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-kichthich',
          x: 120,
          y: 248,
          text: 'kích thích',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 800, opacity: 0 },
            { atMs: 1000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-khucuc',
          x: 143,
          y: 128,
          text: 'khử cực: Na⁺ vào',
          size: 10,
          anchor: 'end',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1800, opacity: 0 },
            { atMs: 2200, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-taiphancuc',
          x: 205,
          y: 116,
          text: 'tái phân cực: K⁺ ra',
          size: 10,
          anchor: 'start',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-tangphancuc',
          x: 246,
          y: 214,
          text: 'tăng phân cực',
          size: 10,
          anchor: 'start',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'cham',
          cx: 60,
          cy: 182,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1000, dx: 60, dy: 0 },
            { atMs: 1800, dx: 80, dy: -18 },
            { atMs: 2200, dx: 90, dy: -72 },
            { atMs: 2600, dx: 100, dy: -120 },
            { atMs: 3000, dx: 115, dy: -112 },
            { atMs: 3600, dx: 135, dy: -62 },
            { atMs: 4200, dx: 155, dy: 0 },
            { atMs: 4800, dx: 180, dy: 12 },
            { atMs: 5600, dx: 220, dy: 6 },
            { atMs: 6400, dx: 260, dy: 0 },
            { atMs: 8000, dx: 380, dy: 0 },
            { atMs: 9000, dx: 380, dy: 0 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Lúc nghỉ, màng giữ ở khoảng −70 mV nhờ kênh rò K⁺ và chênh lệch nồng độ do bơm Na-K duy trì.',
        },
        { atMs: 1000, text: 'Kích thích làm màng khử cực dần tới ngưỡng khoảng −55 mV.' },
        {
          atMs: 1800,
          text: 'Đạt ngưỡng, kênh Na⁺ mở ồ ạt, Na⁺ tràn vào: điện thế vọt lên, đảo cực tới khoảng +30 mV.',
        },
        {
          atMs: 2800,
          text: 'Kênh Na⁺ bất hoạt, kênh K⁺ mở chậm, K⁺ đi ra: màng tái phân cực.',
        },
        {
          atMs: 4400,
          text: 'Kênh K⁺ đóng chậm nên màng tụt dưới mức nghỉ, tiến về gần E_K: tăng phân cực.',
        },
        {
          atMs: 6000,
          text: 'Kênh K⁺ đóng hết, màng trở về −70 mV, sẵn sàng cho xung tiếp theo.',
        },
      ],
    },
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
