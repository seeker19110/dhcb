// lessons/toan8c10.ts — Toán 8, Chương 10: Một số hình khối trong thực tiễn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C10_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c10-b1',
    grade: '8',
    chapterNumber: 10,
    chapterTitle: 'Một số hình khối trong thực tiễn',
    lessonNumber: 1,
    title: 'Hình chóp tam giác đều',
    hook:
      'Chiếc lều trại của đội thiếu niên có dạng một hình chóp: ba mảnh vải hình tam giác cân giống hệt nhau gặp nhau ở một đỉnh, đặt trên nền là một tam giác đều. ' +
      'Đội trưởng cần tính xem phải mua bao nhiêu mét vuông vải để phủ ba mặt bên, và lều chứa được bao nhiêu mét khối không khí. ' +
      'Bài này dạy em nhận biết hình chóp tam giác đều và tính diện tích xung quanh, thể tích của nó.',
    theory:
      'NHẬN BIẾT HÌNH CHÓP TAM GIÁC ĐỀU\n' +
      'Hình chóp tam giác đều S.ABC có:\n' +
      '— Đỉnh S; đáy ABC là tam giác đều.\n' +
      '— Ba mặt bên SAB, SBC, SCA là các tam giác cân bằng nhau (có chung đỉnh S).\n' +
      '— Ba cạnh bên SA, SB, SC bằng nhau; ba cạnh đáy AB, BC, CA bằng nhau.\n' +
      '— Chân đường cao H (hạ từ S xuống đáy) là tâm của tam giác đều ABC (giao điểm ba đường trung tuyến).\n' +
      'Tổng cộng có 4 mặt, 6 cạnh, 4 đỉnh.\n\n' +
      'TRUNG ĐOẠN\n' +
      'Trung đoạn là đường cao kẻ từ đỉnh S của một mặt bên, tức đoạn thẳng nối S với trung điểm M của một cạnh đáy. Vì mặt bên là tam giác cân nên SM vuông góc với cạnh đáy. ' +
      'Cả ba mặt bên bằng nhau nên có ba trung đoạn bằng nhau, ta gọi chung là trung đoạn d.\n' +
      'Áp dụng định lí Pythagore cho tam giác vuông SMA (vuông tại M, MA bằng nửa cạnh đáy): SA² = SM² + MA². Nhờ đó biết trung đoạn và cạnh đáy sẽ tính được cạnh bên.\n\n' +
      'DIỆN TÍCH XUNG QUANH\n' +
      'Mỗi mặt bên là tam giác có đáy a (cạnh đáy) và đường cao d (trung đoạn), diện tích (1/2) · a · d. Ba mặt bên có tổng diện tích 3 · (1/2) · a · d = (3a/2) · d. ' +
      'Mà 3a là chu vi đáy nên 3a/2 là nửa chu vi đáy p. Vậy:\n' +
      '   Sxq = p · d (nửa chu vi đáy nhân trung đoạn).\n' +
      'Diện tích toàn phần: Stp = Sxq + S đáy.\n\n' +
      'THỂ TÍCH\n' +
      '   V = (1/3) · S đáy · h, với h là chiều cao (độ dài SH).\n' +
      'VÌ SAO có hệ số 1/3? Một hình chóp có đáy và chiều cao bằng một hình lăng trụ thì chứa đúng một phần ba thể tích lăng trụ đó.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm trung đoạn với cạnh bên (hoặc với chiều cao): trung đoạn nằm trên MẶT BÊN, chiều cao SH vuông góc với ĐÁY.\n' +
      '— Dùng chu vi đáy thay cho nửa chu vi khi tính Sxq (kết quả gấp đôi).\n' +
      '— Quên hệ số 1/3 khi tính thể tích.\n' +
      '— Lẫn đơn vị: diện tích tính bằng đơn vị vuông, thể tích tính bằng đơn vị khối.',
    workedExample: {
      problem:
        'a) Hình chóp tam giác đều S.ABC có cạnh đáy 6 cm, trung đoạn 4 cm. Tính độ dài cạnh bên SA và diện tích xung quanh. ' +
        'b) Một hình chóp tam giác đều khác có diện tích đáy 15,6 cm² và chiều cao 5 cm. Tính thể tích.',
      steps: [
        'a) Gọi M là trung điểm của AB. SM là trung đoạn nên SM = 4 cm, SM vuông góc với AB và MA = 6 : 2 = 3 cm.',
        'Tam giác SMA vuông tại M: SA² = SM² + MA² = 16 + 9 = 25, nên SA = 5 cm.',
        'Nửa chu vi đáy: p = (6 + 6 + 6) : 2 = 9 cm.',
        'Diện tích xung quanh: Sxq = p · d = 9 · 4 = 36 cm².',
        'b) Thể tích: V = (1/3) · 15,6 · 5 = 78 : 3 = 26 cm³.',
      ],
      answer: 'a) SA = 5 cm; Sxq = 36 cm²; b) V = 26 cm³.',
    },
    checkQuestions: [
      {
        prompt: 'Hình chóp tam giác đều có tất cả bao nhiêu mặt, bao nhiêu cạnh và bao nhiêu đỉnh?',
        choices: [
          { id: 'a', label: '4 mặt, 6 cạnh, 4 đỉnh' },
          { id: 'b', label: '3 mặt, 6 cạnh, 4 đỉnh' },
          { id: 'c', label: '4 mặt, 4 cạnh, 6 đỉnh' },
          { id: 'd', label: '5 mặt, 9 cạnh, 6 đỉnh' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hình chóp tam giác đều gồm 1 mặt đáy và 3 mặt bên (4 mặt), có 3 cạnh đáy và 3 cạnh bên (6 cạnh), 3 đỉnh đáy và 1 đỉnh chóp (4 đỉnh). ' +
          'Phương án d là số mặt, cạnh, đỉnh của hình lăng trụ tam giác. Lỗi hay gặp là quên mặt đáy nên chỉ đếm 3 mặt.',
      },
      {
        prompt:
          'Hình chóp tam giác đều S.ABC có cạnh đáy 6 cm và trung đoạn 4 cm. Độ dài cạnh bên SA bằng bao nhiêu xentimét?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'M là trung điểm AB thì MA = 3 cm và SM = 4 cm vuông góc với AB. Theo Pythagore, SA² = 4² + 3² = 25 nên SA = 5 cm. ' +
          'Lỗi hay gặp là lấy MA bằng cả cạnh đáy 6 cm (được SA = √52) thay vì nửa cạnh đáy.',
      },
      {
        prompt:
          'Một lều trại hình chóp tam giác đều (không tính phần đáy) có cạnh đáy 2 m và trung đoạn 2,5 m. ' +
          'Diện tích vải cần để phủ ba mặt bên là bao nhiêu mét vuông?',
        answer: { kind: 'numeric', value: 7.5 },
        explain:
          'Nửa chu vi đáy là p = 3 · 2 : 2 = 3 m. Diện tích xung quanh Sxq = p · d = 3 · 2,5 = 7,5 m². ' +
          'Lỗi hay gặp là dùng chu vi đáy 6 m rồi nhân 2,5 được 15 m², gấp đôi kết quả đúng.',
      },
      {
        prompt:
          'Một hộp quà hình chóp tam giác đều có diện tích đáy 27 cm² và chiều cao 8 cm. Thể tích hộp quà bằng bao nhiêu xentimét khối?',
        answer: { kind: 'numeric', value: 72 },
        explain:
          'V = (1/3) · S đáy · h = (1/3) · 27 · 8 = 9 · 8 = 72 cm³. ' +
          'Lỗi hay gặp là quên hệ số 1/3 và ra 27 · 8 = 216 cm³, đó là thể tích của lăng trụ có cùng đáy và chiều cao.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hình chóp tam giác đều có đặc điểm gì?',
        dap: 'Đáy là tam giác đều, các mặt bên là các tam giác cân bằng nhau, chân đường cao là tâm của đáy.',
      },
      {
        hoi: 'Trung đoạn của hình chóp đều là gì?',
        dap: 'Là đường cao của một mặt bên kẻ từ đỉnh chóp, nối đỉnh với trung điểm cạnh đáy.',
      },
      {
        hoi: 'Công thức diện tích xung quanh của hình chóp đều?',
        dap: 'Sxq = p · d, với p là nửa chu vi đáy và d là trung đoạn.',
      },
      {
        hoi: 'Công thức thể tích hình chóp?',
        dap: 'V = (1/3) · S đáy · h, với h là chiều cao hạ từ đỉnh xuống đáy.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c10-b2',
    grade: '8',
    chapterNumber: 10,
    chapterTitle: 'Một số hình khối trong thực tiễn',
    lessonNumber: 2,
    title: 'Hình chóp tứ giác đều',
    hook:
      'Kim tự tháp Kheops ở Ai Cập có đáy là hình vuông cạnh khoảng 230 m và bốn mặt bên là bốn tam giác cân gặp nhau ở đỉnh. ' +
      'Hình dạng ấy cũng gặp ở mái lều, mái đình, hay chiếc hộp quà đựng sô cô la. Các nhà xây dựng cần biết cần bao nhiêu vật liệu để phủ mặt bên và khối đá bên trong lớn đến đâu. ' +
      'Bài này dạy em nhận biết hình chóp tứ giác đều và tính diện tích xung quanh, thể tích của nó.',
    theory:
      'NHẬN BIẾT HÌNH CHÓP TỨ GIÁC ĐỀU\n' +
      'Hình chóp tứ giác đều S.ABCD có:\n' +
      '— Đỉnh S; đáy ABCD là hình vuông.\n' +
      '— Bốn mặt bên là các tam giác cân bằng nhau (có chung đỉnh S).\n' +
      '— Bốn cạnh bên SA, SB, SC, SD bằng nhau.\n' +
      '— Chân đường cao H trùng với tâm hình vuông ABCD (giao điểm hai đường chéo).\n' +
      'Có 5 mặt (1 đáy và 4 mặt bên), 8 cạnh, 5 đỉnh.\n\n' +
      'TRUNG ĐOẠN VÀ CÁC MỐI QUAN HỆ ĐỘ DÀI\n' +
      'Trung đoạn d là đường cao của một mặt bên kẻ từ đỉnh S, nối S với trung điểm M của một cạnh đáy.\n' +
      'Gọi a là cạnh đáy. Do H là tâm hình vuông nên khoảng cách HM từ tâm đến cạnh bằng a/2. Tam giác SHM vuông tại H, nên theo Pythagore:\n' +
      '   d² = h² + (a/2)²\n' +
      'với h là chiều cao SH. Tương tự trong tam giác SMA vuông tại M: SA² = d² + (a/2)².\n\n' +
      'DIỆN TÍCH XUNG QUANH\n' +
      'Mỗi mặt bên có diện tích (1/2) · a · d. Bốn mặt bên: 4 · (1/2) · a · d = 2a · d. Chu vi đáy là 4a nên nửa chu vi p = 2a. Vậy:\n' +
      '   Sxq = p · d = 2a · d.\n' +
      'Diện tích toàn phần: Stp = Sxq + a² (a² là diện tích đáy hình vuông).\n\n' +
      'THỂ TÍCH\n' +
      '   V = (1/3) · S đáy · h = (1/3) · a² · h.\n' +
      'VÌ SAO có hệ số 1/3? Hình chóp chỉ chiếm một phần ba thể tích khối lăng trụ có cùng đáy và cùng chiều cao.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm trung đoạn d với chiều cao h hoặc cạnh bên. Chiều cao vuông góc với đáy, trung đoạn nằm trên mặt bên.\n' +
      '— Khi tính trung đoạn quên lấy HM = a/2 mà dùng nhầm cả cạnh a.\n' +
      '— Dùng chu vi đáy thay cho nửa chu vi trong công thức Sxq (gấp đôi).\n' +
      '— Quên hệ số 1/3, hoặc quên tính diện tích đáy a² trước khi nhân với chiều cao.',
    workedExample: {
      problem:
        'Một toà nhà kính hình chóp tứ giác đều có cạnh đáy 30 m và chiều cao 20 m. ' +
        'Tính: a) trung đoạn; b) diện tích xung quanh (diện tích bốn mặt kính); c) thể tích toà nhà.',
      steps: [
        'Gọi H là tâm đáy, M là trung điểm một cạnh đáy thì HM = 30 : 2 = 15 m. Chiều cao SH = 20 m.',
        'Tam giác SHM vuông tại H: SM² = 20² + 15² = 400 + 225 = 625, nên trung đoạn d = SM = 25 m.',
        'Nửa chu vi đáy: p = (4 · 30) : 2 = 60 m. Diện tích xung quanh: Sxq = p · d = 60 · 25 = 1500 m².',
        'Diện tích đáy: S đáy = 30 · 30 = 900 m².',
        'Thể tích: V = (1/3) · 900 · 20 = 6000 m³.',
      ],
      answer: 'a) 25 m; b) 1500 m²; c) 6000 m³.',
    },
    checkQuestions: [
      {
        prompt: 'Phát biểu nào sau đây về hình chóp tứ giác đều S.ABCD là đúng?',
        choices: [
          {
            id: 'a',
            label: 'Đáy là hình vuông và chân đường cao trùng với giao điểm hai đường chéo của đáy',
          },
          { id: 'b', label: 'Đáy là hình chữ nhật không phải hình vuông' },
          { id: 'c', label: 'Bốn mặt bên đều là tam giác vuông' },
          { id: 'd', label: 'Hình có 4 mặt và 6 cạnh' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hình chóp tứ giác đều có đáy là hình vuông và đường cao hạ từ đỉnh S rơi đúng tâm hình vuông. Bốn mặt bên là các tam giác cân (không phải tam giác vuông) ' +
          'và hình có 5 mặt, 8 cạnh. Lỗi hay gặp là nhầm với hình chóp tam giác đều có 4 mặt và 6 cạnh.',
      },
      {
        prompt:
          'Một mái lều hình chóp tứ giác đều (không tính đáy) có cạnh đáy 4 m và trung đoạn 3 m. Diện tích vải cần để phủ bốn mặt bên là bao nhiêu mét vuông?',
        answer: { kind: 'numeric', value: 24 },
        explain:
          'Nửa chu vi đáy là p = (4 · 4) : 2 = 8 m. Diện tích xung quanh Sxq = p · d = 8 · 3 = 24 m². ' +
          'Lỗi hay gặp là dùng chu vi 16 m được 48 m², gấp đôi đáp số đúng, hoặc cộng thêm cả diện tích đáy 16 m² dù lều không có đáy.',
      },
      {
        prompt:
          'Một hộp quà hình chóp tứ giác đều có cạnh đáy 10 cm và chiều cao 12 cm. Thể tích hộp quà bằng bao nhiêu xentimét khối?',
        answer: { kind: 'numeric', value: 400 },
        explain:
          'Diện tích đáy là 10 · 10 = 100 cm². Thể tích V = (1/3) · 100 · 12 = 400 cm³. ' +
          'Lỗi hay gặp là quên hệ số 1/3 (được 1200 cm³) hoặc lấy diện tích đáy bằng 10 thay vì 100.',
      },
      {
        prompt:
          'Hình chóp tứ giác đều có cạnh đáy 16 cm và chiều cao 6 cm. Độ dài trung đoạn bằng bao nhiêu xentimét?',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'Khoảng cách từ tâm đáy đến cạnh đáy là 16 : 2 = 8 cm. Trung đoạn d thoả d² = 6² + 8² = 36 + 64 = 100 nên d = 10 cm. ' +
          'Lỗi hay gặp là lấy 16 thay cho 8 trong phép tính (được √292) hoặc cộng 6 + 8 = 14 mà không dùng Pythagore.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hình chóp tứ giác đều có đặc điểm gì?',
        dap: 'Đáy là hình vuông, bốn mặt bên là các tam giác cân bằng nhau, chân đường cao là tâm của đáy.',
      },
      {
        hoi: 'Diện tích xung quanh của hình chóp tứ giác đều có cạnh đáy a và trung đoạn d?',
        dap: 'Sxq = p · d = 2a · d, vì nửa chu vi đáy p = 2a.',
      },
      {
        hoi: 'Thể tích hình chóp tứ giác đều có cạnh đáy a và chiều cao h?',
        dap: 'V = (1/3) · a² · h.',
      },
      {
        hoi: 'Quan hệ giữa trung đoạn d, chiều cao h và cạnh đáy a?',
        dap: 'd² = h² + (a/2)², suy từ tam giác vuông SHM.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
