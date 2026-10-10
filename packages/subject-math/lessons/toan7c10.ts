// lessons/toan7c10.ts — Toán 7, Chương 10: Một số hình khối trong thực tiễn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C10_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c10-b1',
    grade: '7',
    chapterNumber: 10,
    chapterTitle: 'Một số hình khối trong thực tiễn',
    lessonNumber: 1,
    title: 'Hình hộp chữ nhật và hình lập phương',
    hook:
      'Bạn Lan muốn gói một hộp quà hình hộp chữ nhật tặng sinh nhật bạn thân. Lan cần biết hai điều: phải mua bao nhiêu giấy gói để phủ kín bề mặt hộp, ' +
      'và hộp chứa được bao nhiêu đồ bên trong. Hai câu hỏi đó chính là tính diện tích các mặt và tính thể tích. ' +
      'Hộp sữa, viên gạch, chiếc tủ, bể cá đều là hình hộp chữ nhật. Bài này dạy em các yếu tố của hình hộp chữ nhật, hình lập phương và cách tính diện tích, thể tích của chúng.',
    theory:
      'CÁC YẾU TỐ CỦA HÌNH HỘP CHỮ NHẬT\n' +
      'Hình hộp chữ nhật có 6 mặt, mỗi mặt là một hình chữ nhật; có 8 đỉnh và 12 cạnh. ' +
      'Các mặt đối diện bằng nhau. Mười hai cạnh chia thành ba nhóm, mỗi nhóm bốn cạnh bằng nhau; ba kích thước là chiều dài a, chiều rộng b và chiều cao c.\n' +
      'Đường chéo là đoạn thẳng nối hai đỉnh không cùng nằm trên một mặt. Hình hộp chữ nhật có 4 đường chéo, chúng bằng nhau và cắt nhau tại trung điểm của mỗi đường.\n\n' +
      'HÌNH LẬP PHƯƠNG\n' +
      'Hình lập phương là hình hộp chữ nhật đặc biệt có 6 mặt đều là hình vuông bằng nhau, tức cả 12 cạnh bằng nhau (độ dài a). Con xúc xắc và khối rubik là hình lập phương.\n\n' +
      'CÔNG THỨC\n' +
      'Hình hộp chữ nhật có đáy là hình chữ nhật kích thước a, b và chiều cao c:\n' +
      '— Diện tích xung quanh (bốn mặt bên): Sxq = chu vi đáy · chiều cao = 2(a + b) · c.\n' +
      '— Diện tích toàn phần (cả sáu mặt): Stp = Sxq + 2 · diện tích đáy = 2(a + b)c + 2ab.\n' +
      '— Thể tích: V = a · b · c (diện tích đáy nhân chiều cao).\n' +
      'Hình lập phương cạnh a: Sxq = 4a²; Stp = 6a²; V = a³.\n' +
      'VÌ SAO Sxq = chu vi đáy · chiều cao? Nếu cắt rời bốn mặt bên rồi trải phẳng thì được một hình chữ nhật có một cạnh bằng chu vi đáy và cạnh kia bằng chiều cao.\n\n' +
      'ĐƠN VỊ\n' +
      'Diện tích tính bằng đơn vị bình phương (cm², m²), thể tích bằng đơn vị lập phương (cm³, m³). ' +
      'Đổi đơn vị: 1 lít = 1 dm³ = 1000 cm³; 1 m³ = 1000 lít. Các kích thước phải cùng đơn vị trước khi tính.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm diện tích xung quanh (4 mặt bên) với diện tích toàn phần (6 mặt).\n' +
      '— Dùng chu vi đáy mà quên nhân với chiều cao, hoặc quên nhân 2 trong 2(a + b).\n' +
      '— Dùng công thức diện tích (đơn vị bình phương) để tính thể tích hoặc ngược lại.\n' +
      '— Không đổi cùng đơn vị (cm với m) trước khi tính.\n' +
      '— Đếm sai số cạnh, số đỉnh: hộp có 12 cạnh, 8 đỉnh chứ không phải 8 cạnh.',
    workedExample: {
      problem:
        'Một bể cá kính hình hộp chữ nhật, không có nắp, dài 80 cm, rộng 40 cm, cao 50 cm. ' +
        'Tính diện tích kính cần dùng (bốn mặt bên và đáy), thể tích bể và số lít nước khi nước cao 40 cm.',
      steps: [
        'Diện tích xung quanh: Sxq = 2(80 + 40) · 50 = 2 · 120 · 50 = 12 000 (cm²).',
        'Diện tích đáy: 80 · 40 = 3 200 (cm²).',
        'Bể không có nắp nên diện tích kính = Sxq + diện tích đáy = 12 000 + 3 200 = 15 200 (cm²).',
        'Thể tích bể: V = 80 · 40 · 50 = 160 000 (cm³) = 160 lít.',
        'Thể tích nước khi cao 40 cm: 80 · 40 · 40 = 128 000 (cm³) = 128 lít.',
      ],
      answer:
        'Diện tích kính 15 200 cm²; thể tích bể 160 000 cm³ (160 lít); nước cao 40 cm chứa 128 lít.',
    },
    checkQuestions: [
      {
        prompt: 'Hình hộp chữ nhật có đủ các yếu tố nào sau đây (đỉnh, cạnh, mặt, đường chéo)?',
        choices: [
          { id: 'a', label: '8 đỉnh, 12 cạnh, 6 mặt, 4 đường chéo' },
          { id: 'b', label: '8 đỉnh, 12 cạnh, 6 mặt, 6 đường chéo' },
          { id: 'c', label: '6 đỉnh, 12 cạnh, 8 mặt, 4 đường chéo' },
          { id: 'd', label: '8 đỉnh, 10 cạnh, 6 mặt, 4 đường chéo' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hình hộp chữ nhật có 8 đỉnh, 12 cạnh, 6 mặt và 4 đường chéo (mỗi đường nối hai đỉnh đối nhau qua tâm hộp). ' +
          'Lỗi hay gặp là nhầm số đỉnh với số mặt (6 mặt, 8 đỉnh), hoặc đếm cả đường chéo của từng mặt vào đường chéo của hộp.',
      },
      {
        prompt:
          'Một hình lập phương có thể tích 125 cm³. Tổng độ dài của tất cả các cạnh của hình lập phương đó là bao nhiêu cm?',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'Vì 5 · 5 · 5 = 125 nên cạnh a = 5 cm. Hình lập phương có 12 cạnh bằng nhau, tổng độ dài là 12 · 5 = 60 (cm). ' +
          'Lỗi hay gặp là lấy 125 : 3 thay vì tìm số nhân với chính nó ba lần ra 125, hoặc chỉ nhân với 6 vì nhầm số mặt với số cạnh.',
      },
      {
        prompt:
          'Một hình hộp chữ nhật có đáy là hình chữ nhật 6 cm × 4 cm và chiều cao 5 cm. Tính diện tích xung quanh (đơn vị cm²).',
        answer: { kind: 'numeric', value: 100 },
        explain:
          'Sxq = chu vi đáy · chiều cao = 2(6 + 4) · 5 = 20 · 5 = 100 (cm²). ' +
          'Lỗi hay gặp là quên nhân đôi (tính (6 + 4) · 5 = 50) hoặc cộng thêm diện tích hai đáy, dẫn tới diện tích toàn phần 148 cm².',
      },
      {
        prompt:
          'Phòng học dài 8 m, rộng 6 m, cao 3,5 m. Cần sơn bốn bức tường (không sơn trần, sàn). Các cửa và cửa sổ có tổng diện tích 12 m² không phải sơn. ' +
          'Diện tích tường cần sơn là bao nhiêu m²?',
        answer: { kind: 'numeric', value: 86 },
        explain:
          'Diện tích bốn bức tường là diện tích xung quanh: 2(8 + 6) · 3,5 = 98 (m²). Trừ phần cửa: 98 − 12 = 86 (m²). ' +
          'Lỗi hay gặp là tính cả trần và sàn (diện tích toàn phần), hoặc quên trừ phần diện tích cửa.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hình hộp chữ nhật có bao nhiêu mặt, cạnh, đỉnh, đường chéo?',
        dap: '6 mặt (hình chữ nhật), 12 cạnh, 8 đỉnh, 4 đường chéo bằng nhau.',
      },
      {
        hoi: 'Công thức Sxq, Stp, V của hình hộp chữ nhật (a, b, c)?',
        dap: 'Sxq = 2(a + b)c; Stp = Sxq + 2ab; V = abc.',
      },
      {
        hoi: 'Công thức Sxq, Stp, V của hình lập phương cạnh a?',
        dap: 'Sxq = 4a²; Stp = 6a²; V = a³.',
      },
      {
        hoi: 'Đổi đơn vị thể tích: 1 lít bằng bao nhiêu cm³?',
        dap: '1 lít = 1 dm³ = 1000 cm³; 1 m³ = 1000 lít.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c10-b2',
    grade: '7',
    chapterNumber: 10,
    chapterTitle: 'Một số hình khối trong thực tiễn',
    lessonNumber: 2,
    title: 'Hình lăng trụ đứng tam giác và hình lăng trụ đứng tứ giác',
    hook:
      'Chiếc lều trại của nhóm em có hai đầu là hai tấm vải hình tam giác, còn thân lều là ba mảnh vải hình chữ nhật (hai mái nghiêng và một sàn). ' +
      'Hộp bánh quy hình ngôi nhà, thanh sô-cô-la dạng tam giác, mái nhà dốc hai bên đều có dạng như vậy. ' +
      'Các hình khối này gọi là hình lăng trụ đứng. Bài này dạy em nhận biết chúng, tính diện tích vải cần may và thể tích không khí bên trong.',
    theory:
      'HÌNH LĂNG TRỤ ĐỨNG\n' +
      'Hình lăng trụ đứng có hai mặt đáy là hai đa giác bằng nhau nằm trên hai mặt phẳng song song; các mặt bên là các hình chữ nhật; ' +
      'các cạnh bên vuông góc với đáy và bằng nhau, độ dài cạnh bên chính là chiều cao h của lăng trụ.\n' +
      '— Lăng trụ đứng tam giác: đáy là tam giác. Có 2 đáy và 3 mặt bên (tổng 5 mặt), 6 đỉnh, 9 cạnh.\n' +
      '— Lăng trụ đứng tứ giác: đáy là tứ giác. Có 2 đáy và 4 mặt bên (tổng 6 mặt), 8 đỉnh, 12 cạnh. ' +
      'Hình hộp chữ nhật và hình lập phương là những lăng trụ đứng tứ giác đặc biệt (đáy là hình chữ nhật, hình vuông).\n\n' +
      'CÔNG THỨC\n' +
      'Gọi S là diện tích đáy, C là chu vi đáy, h là chiều cao:\n' +
      '— Diện tích xung quanh: Sxq = C · h.\n' +
      '— Diện tích toàn phần: Stp = Sxq + 2S.\n' +
      '— Thể tích: V = S · h.\n' +
      'VÌ SAO Sxq = C · h? Các mặt bên đều là hình chữ nhật có chiều cao h, các chiều rộng chính là các cạnh của đáy. Cộng lại: (a + b + c) · h = chu vi đáy · h.\n' +
      'VÌ SAO V = S · h? Ta xếp chồng các lớp mỏng giống hệt đáy; có "h" lớp nên thể tích bằng diện tích một lớp nhân với chiều cao.\n\n' +
      'LƯU Ý VỀ ĐÁY\n' +
      'Đáy là hai mặt song song bằng nhau, không nhất thiết nằm dưới. Với lều trại nằm ngang, đáy là mặt tam giác ở hai đầu, chiều cao của lăng trụ là chiều dài lều. ' +
      'Cần tính đúng diện tích đáy: tam giác S = ½ · cạnh · đường cao; hình thang S = ½ · (đáy lớn + đáy nhỏ) · đường cao; hình thoi S = ½ · tích hai đường chéo.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm chiều cao h của lăng trụ với đường cao của tam giác đáy.\n' +
      '— Quên nhân ½ khi tính diện tích tam giác đáy.\n' +
      '— Tính chu vi đáy thiếu một cạnh, hoặc quên nhân với chiều cao.\n' +
      '— Quên cộng hai lần diện tích đáy khi tính diện tích toàn phần.',
    workedExample: {
      problem:
        'Một chiếc lều có hai đầu là tam giác cân với cạnh đáy 1,8 m, chiều cao 1,2 m và hai cạnh bên bằng 1,5 m. Chiều dài lều 2,5 m. ' +
        'Tính thể tích không khí trong lều, diện tích vải ba mặt chữ nhật (hai mái và sàn), và diện tích toàn phần.',
      steps: [
        'Lều là hình lăng trụ đứng tam giác. Đáy là tam giác cân, chiều cao của lăng trụ là chiều dài lều h = 2,5 m.',
        'Diện tích đáy: S = ½ · 1,8 · 1,2 = 1,08 (m²).',
        'Thể tích: V = S · h = 1,08 · 2,5 = 2,7 (m³).',
        'Chu vi đáy: C = 1,5 + 1,5 + 1,8 = 4,8 (m).',
        'Diện tích ba mặt chữ nhật: Sxq = C · h = 4,8 · 2,5 = 12 (m²).',
        'Diện tích toàn phần (kể cả hai đầu hình tam giác): Stp = 12 + 2 · 1,08 = 14,16 (m²).',
      ],
      answer: 'V = 2,7 m³; Sxq = 12 m²; Stp = 14,16 m².',
    },
    checkQuestions: [
      {
        prompt: 'Hình lăng trụ đứng tam giác có bao nhiêu đỉnh, cạnh và mặt (theo thứ tự đó)?',
        choices: [
          { id: 'a', label: '6 đỉnh, 9 cạnh, 5 mặt' },
          { id: 'b', label: '5 đỉnh, 9 cạnh, 6 mặt' },
          { id: 'c', label: '6 đỉnh, 6 cạnh, 5 mặt' },
          { id: 'd', label: '6 đỉnh, 9 cạnh, 6 mặt' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Mỗi đáy tam giác có 3 đỉnh và 3 cạnh, hai đáy cho 6 đỉnh và 6 cạnh; thêm 3 cạnh bên được 9 cạnh. Mặt gồm 2 đáy và 3 mặt bên là 5 mặt. ' +
          'Lỗi hay gặp là nhầm số mặt với số đỉnh hoặc bỏ sót ba cạnh bên.',
      },
      {
        prompt:
          'Một hình lăng trụ đứng tứ giác có đáy là hình thoi với hai đường chéo 6 cm và 8 cm, chiều cao lăng trụ 5 cm. ' +
          'Tính thể tích (đơn vị cm³).',
        answer: { kind: 'numeric', value: 120 },
        explain:
          'Diện tích đáy (hình thoi) = ½ · 6 · 8 = 24 (cm²). Thể tích V = S · h = 24 · 5 = 120 (cm³). ' +
          'Lỗi hay gặp là quên nhân ½ ở diện tích hình thoi và nhận 6 · 8 · 5 = 240, hoặc nhầm 5 cm với một cạnh của đáy.',
      },
      {
        prompt:
          'Một hình lăng trụ đứng có đáy là tam giác với ba cạnh 6 cm, 8 cm, 10 cm và chiều cao 7 cm. ' +
          'Tính diện tích xung quanh (đơn vị cm²).',
        answer: { kind: 'numeric', value: 168 },
        explain:
          'Chu vi đáy = 6 + 8 + 10 = 24 (cm). Sxq = chu vi đáy · chiều cao = 24 · 7 = 168 (cm²). ' +
          'Lỗi hay gặp là dùng diện tích đáy thay cho chu vi đáy, hoặc cộng thêm diện tích hai đáy (đó là diện tích toàn phần).',
      },
      {
        prompt:
          'Một đoạn mương thoát nước dài 30 m. Mặt cắt ngang của mương là hình thang cân có đáy lớn 1,4 m, đáy nhỏ 0,6 m, chiều sâu 0,5 m. ' +
          'Mương là lăng trụ đứng tứ giác với hai đáy là hai mặt cắt đầu mương. Tính thể tích nước tối đa mà đoạn mương chứa được (đơn vị m³).',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'Diện tích đáy (hình thang) = ½ · (1,4 + 0,6) · 0,5 = 0,5 (m²). Chiều cao của lăng trụ là chiều dài mương 30 m, nên V = 0,5 · 30 = 15 (m³). ' +
          'Lỗi hay gặp là nhầm chiều cao của lăng trụ (30 m) với chiều sâu của mương (0,5 m).',
      },
    ],
    srsCards: [
      {
        hoi: 'Hình lăng trụ đứng có những đặc điểm gì?',
        dap: 'Hai đáy là hai đa giác bằng nhau nằm trên hai mặt phẳng song song; các mặt bên là hình chữ nhật; cạnh bên vuông góc với đáy và bằng chiều cao.',
      },
      {
        hoi: 'Công thức Sxq, Stp, V của hình lăng trụ đứng?',
        dap: 'Sxq = chu vi đáy · chiều cao; Stp = Sxq + 2 · diện tích đáy; V = diện tích đáy · chiều cao.',
      },
      {
        hoi: 'Lăng trụ đứng tam giác có bao nhiêu đỉnh, cạnh, mặt?',
        dap: '6 đỉnh, 9 cạnh, 5 mặt (2 đáy tam giác và 3 mặt bên hình chữ nhật).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
