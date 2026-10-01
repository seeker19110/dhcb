// lessons/ly10c1.ts — Vật lí 10, Chương 1: Mở đầu (3 bài).
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY10_C1_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c1-b1',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Mở đầu',
    lessonNumber: 1,
    title: 'Làm quen với Vật lí',
    hook:
      'Từ quả táo rơi từ trên cây đến sự chuyển động của các thiên hà xa xôi, mọi hiện tượng tự nhiên ' +
      'đều tuân theo những quy luật vật lí nhất định. Vật lí học chính là chìa khóa mở cánh cửa hiểu biết vũ trụ.',
    theory:
      '## Đối tượng và phương pháp nghiên cứu vật lí\n' +
      '— Đối tượng nghiên cứu: Các dạng vận động của vật chất và năng lượng trong tự nhiên.\n' +
      '— Phân ngành Vật lí chính: Cơ học, Nhiệt học, Quang học, Điện và Từ học, Vật lí hạt nhân, Cơ học lượng tử.\n' +
      '— Hai phương pháp nghiên cứu chính bổ trợ cho nhau:\n' +
      '  1. Phương pháp thực nghiệm: Sử dụng các quan sát và thí nghiệm thực tế để kiểm chứng giả thuyết hoặc phát hiện quy luật mới.\n' +
      '  2. Phương pháp lí thuyết: Sử dụng mô hình toán học và suy luận logic để dự đoán các hiện tượng mới và giải thích quy luật đã có.\n\n' +
      '## Vai trò của vật lí trong cuộc sống và công nghệ\n' +
      '— Vật lí là nền tảng của nhiều ngành kĩ thuật và công nghệ (điện tử, tự động hoá, hàng không, viễn thông).\n' +
      '— Ứng dụng trong y học (chẩn đoán hình ảnh bằng tia X, MRI, siêu âm) và nông nghiệp, môi trường.',
    workedExample: {
      problem:
        'Phân biệt phương pháp thực nghiệm và phương pháp lí thuyết trong nghiên cứu Vật lí thông qua ví dụ lịch sử ' +
        'về sự rơi tự do của Galileo Galilei và Aristotle.',
      steps: [
        'Aristotle dùng suy luận định tính đưa ra lí thuyết: Vật nặng rơi nhanh hơn vật nhẹ (phương pháp lí thuyết chưa kiểm chứng).',
        'Galileo Galilei hoài nghi giả thuyết trên. Theo giai thoại nổi tiếng, ông thả các quả cầu có khối lượng khác nhau ' +
          'từ tháp nghiêng Pisa (phương pháp thực nghiệm) và thấy chúng chạm đất gần như cùng lúc.',
        'Kết luận: Trong Vật lí, phương pháp thực nghiệm đóng vai trò quyết định để kiểm chứng và bác bỏ hay công nhận một lí thuyết.',
      ],
      answer:
        'Phương pháp thực nghiệm kiểm chứng bằng thí nghiệm thực tế; phương pháp lí thuyết xây dựng mô hình suy luận.',
    },
    checkQuestions: [
      {
        prompt:
          'Phương pháp nghiên cứu nào sử dụng các mô hình toán học và lập luận logic để xây dựng quy luật Vật lí?',
        choices: [
          { id: 'lt', label: 'Phương pháp lí thuyết' },
          { id: 'tn', label: 'Phương pháp thực nghiệm' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['lt'],
        },
        explain:
          'Phương pháp lí thuyết dùng suy luận và mô hình toán học nên chọn "lí thuyết" là đúng. Phương pháp thực ' +
          'nghiệm thì khác: nó dựa vào thí nghiệm và số liệu đo, không phải vào lập luận toán học.',
      },
      {
        prompt:
          'Vật lí học nghiên cứu về các dạng vận động của hai đối tượng cơ bản nào trong tự nhiên?',
        choices: [
          { id: 'mc_nl', label: 'Vật chất và năng lượng' },
          { id: 'sh_hh', label: 'Sinh vật và hợp chất hoá học' },
          { id: 'td_vt', label: 'Trái Đất và vũ trụ học' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['mc_nl'],
        },
        explain:
          'Đối tượng nghiên cứu của Vật lí tập trung vào các dạng vận động của vật chất và năng lượng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai phương pháp nghiên cứu cơ bản của Vật lí học là gì?',
        dap: 'Phương pháp thực nghiệm và phương pháp lí thuyết.',
      },
      {
        hoi: 'Phương pháp thực nghiệm có vai trò gì đối với một giả thuyết lí thuyết?',
        dap: 'Kiểm chứng giả thuyết đó đúng hay sai bằng thực tế thí nghiệm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c1-b2',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Mở đầu',
    lessonNumber: 2,
    title: 'Các quy tắc an toàn trong phòng thực hành Vật lí',
    hook:
      'Thực hành thí nghiệm giúp chúng ta kiểm chứng lí thuyết, nhưng các thiết bị điện áp cao, tia laser hay nguồn nhiệt ' +
      'có thể gây nguy hiểm nghiêm trọng nếu không tuân thủ nghiêm ngặt các quy tắc an toàn.',
    theory:
      '## Quy tắc an toàn chung\n' +
      '— Không tự ý cắm điện hoặc bật công tắc nguồn thiết bị khi chưa có sự đồng ý của giáo viên.\n' +
      '— Kiểm tra các thông số kĩ thuật (giới hạn đo, điện áp định mức) trước khi kết nối thiết bị.\n' +
      '— Bố trí thiết bị gọn gàng, tránh xa mép bàn và các chất dễ cháy nổ.\n\n' +
      '## An toàn điện và thiết bị đo\n' +
      '— Luôn ngắt công tắc nguồn điện trước khi thay đổi sơ đồ mạch điện hoặc lắp ráp linh kiện.\n' +
      '— Tránh tiếp xúc trực tiếp với dây dẫn trần hoặc các phần kim loại mang điện áp trên 40V.\n' +
      '— Không sử dụng thiết bị đo (như ampe kế) vượt quá thang đo cho phép để tránh cháy hỏng.\n\n' +
      '## Các biển cảnh báo thường gặp\n' +
      '— Hình tam giác viền đen nền vàng: Cảnh báo nguy hiểm (điện cao thế, bề mặt nóng, tia laser, chất phóng xạ).\n' +
      '— Hình tròn viền đỏ nền trắng: Biển báo cấm (cấm lửa, cấm chạm vào điện).',
    workedExample: {
      problem:
        'Một học sinh lắp ráp một mạch điện có sử dụng nguồn điện một chiều 24V. Khi chuẩn bị bật nguồn điện, ' +
        'học sinh này phát hiện thấy dây nối bị hở một đoạn nhỏ. Học sinh nên xử lí thế nào?',
      steps: [
        'Bước 1: Không được bật nguồn điện.',
        'Bước 2: Báo ngay cho giáo viên hướng dẫn trong phòng thực hành để thay thế dây nối khác an toàn.',
        'Bước 3: Tuyệt đối không dùng tay chạm trực tiếp hay dùng băng dính tự sửa khi chưa có chỉ dẫn của giáo viên.',
      ],
      answer: 'Không bật nguồn điện, báo ngay cho giáo viên để thay thế dây dẫn an toàn.',
    },
    checkQuestions: [
      {
        prompt:
          'Trước khi cắm một thiết bị điện vào ổ cắm nguồn trong phòng thực hành, ta bắt buộc phải kiểm tra thông số nào?',
        choices: [
          { id: 'mau_sac', label: 'Màu sắc và kích thước của phích cắm' },
          { id: 'dien_ap', label: 'Điện áp định mức của thiết bị có khớp với nguồn không' },
          { id: 'nhiet_do', label: 'Nhiệt độ phòng lúc đó' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dien_ap'],
        },
        explain:
          'Cắm thiết bị vào nguồn điện không phù hợp (ví dụ thiết bị 110V cắm vào ổ 220V) sẽ gây cháy nổ, hỏng thiết bị.',
      },
      {
        prompt:
          'Khi lắp ráp hoặc thay đổi sơ đồ mạch điện trong thí nghiệm, trạng thái của nguồn điện phải như thế nào?',
        choices: [
          { id: 'ngat_nguon', label: 'Phải ngắt hoàn toàn nguồn điện (tắt công tắc)' },
          { id: 'bat_nguon', label: 'Vẫn bật nguồn điện bình thường để kiểm tra luôn' },
          { id: 'tuy_y', label: 'Tuỳ ý học sinh thấy tiện' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ngat_nguon'],
        },
        explain:
          'Ngắt nguồn điện giúp ngăn ngừa nguy cơ bị điện giật và chập cháy mạch điện khi lắp ráp.',
      },
    ],
    srsCards: [
      {
        hoi: 'Kí hiệu hình tam giác nền vàng có hình tia sét màu đen cảnh báo điều gì?',
        dap: 'Cảnh báo nguy hiểm về điện cao thế.',
      },
      {
        hoi: 'Tại sao cần ngắt nguồn điện trước khi thay đổi linh kiện mạch điện thực hành?',
        dap: 'Để phòng tránh điện giật và tránh chập mạch làm cháy hỏng linh kiện.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c1-b3',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Mở đầu',
    lessonNumber: 3,
    title: 'Thực hành tính sai số trong phép đo. Ghi kết quả đo',
    hook:
      'Không có phép đo Vật lí nào thu được kết quả hoàn hảo 100%. Mọi số liệu thực tế luôn kèm theo một độ lệch gọi là sai số. ' +
      'Học cách tính và trình bày sai số là kĩ năng căn bản nhất để phân biệt khoa học thực thụ với suy đoán.',
    theory:
      '## Phép đo trực tiếp và phép đo gián tiếp\n' +
      '— Phép đo trực tiếp: Đọc kết quả trực tiếp từ dụng cụ đo (đo chiều dài bằng thước, đo thời gian bằng đồng hồ).\n' +
      '— Phép đo gián tiếp: Tính toán giá trị qua công thức liên hệ với các đại lượng đo trực tiếp (đo vận tốc v = s/t thông qua s và t).\n\n' +
      '## Phân loại sai số\n' +
      '1. Sai số hệ thống (Systematic error): Do đặc điểm cấu tạo dụng cụ (lệch điểm 0). Sai số hệ thống của dụng cụ thường được lấy bằng một nửa hoặc một độ chia nhỏ nhất của dụng cụ (gọi là sai số dụng cụ Δx_dc).\n' +
      '2. Sai số ngẫu nhiên (Random error): Do hạn chế giác quan, phản xạ, hoặc điều kiện môi trường thay đổi đột ngột. Khắc phục bằng cách đo nhiều lần.\n\n' +
      '## Công thức tính sai số phép đo trực tiếp (Đo n lần)\n' +
      '— Giá trị trung bình: x̄ = (x₁ + x₂ + ... + x_n) / n.\n' +
      '— Sai số tuyệt đối của mỗi lần đo: Δx_i = |x̄ - x_i|.\n' +
      '— Sai số ngẫu nhiên trung bình: Δx_tb = (Δx₁ + Δx₂ + ... + Δx_n) / n.\n' +
      '— Sai số tuyệt đối của phép đo: Δx = Δx_tb + Δx_dc.\n' +
      '— Cách ghi kết quả đo: x = x̄ ± Δx (kèm đơn vị).\n' +
      '— Sai số tỉ đối (Relative error): δx = (Δx / x̄) * 100% (càng nhỏ phép đo càng chính xác).',
    workedExample: {
      problem:
        'Học sinh đo thời gian một vật rơi tự do 5 lần thu được các kết quả: 0,40s; 0,42s; 0,38s; 0,41s; 0,39s. ' +
        'Biết sai số dụng cụ đo là 0,01s. Hãy tính giá trị trung bình, sai số tuyệt đối của phép đo và viết kết quả.',
      steps: [
        'Bước 1: Tính giá trị trung bình t̄ = (0,40 + 0,42 + 0,38 + 0,41 + 0,39) / 5 = 0,40 (s).',
        'Bước 2: Tính sai số tuyệt đối từng lần đo: Δt₁ = |0,40 - 0,40| = 0,00; Δt₂ = 0,02; Δt₃ = 0,02; Δt₄ = 0,01; Δt₅ = 0,01.',
        'Bước 3: Tính sai số ngẫu nhiên trung bình: Δt_tb = (0,00 + 0,02 + 0,02 + 0,01 + 0,01) / 5 = 0,012 (s). Làm tròn thành 0,01s.',
        'Bước 4: Tính sai số tuyệt đối tổng cộng: Δt = Δt_tb + Δt_dc = 0,01 + 0,01 = 0,02 (s).',
        'Bước 5: Viết kết quả phép đo: t = 0,40 ± 0,02 (s).',
      ],
      answer: 't = 0,40 ± 0,02 s',
    },
    checkQuestions: [
      {
        prompt: 'Sai số tỉ đối δx của phép đo được tính theo công thức nào sau đây?',
        choices: [
          { id: 'cong_1', label: 'δx = (Δx / x̄) * 100%' },
          { id: 'cong_2', label: 'δx = (x̄ / Δx) * 100%' },
          { id: 'cong_3', label: 'δx = Δx + x̄' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cong_1'],
        },
        explain:
          'Sai số tỉ đối bằng tỉ số giữa sai số tuyệt đối và giá trị trung bình, nhân với 100%.',
      },
      {
        prompt:
          'Cho giá trị trung bình của chiều dài đo được là L̄ = 12,45 cm và sai số tuyệt đối của phép đo là ΔL = 0,03 cm. Hãy chọn cách ghi kết quả đo đúng chuẩn nhất.',
        choices: [
          { id: 'ghi_1', label: 'L = 12,45 ± 0,03 (cm)' },
          { id: 'ghi_2', label: 'L = 12,45 + 0,03 (cm)' },
          { id: 'ghi_3', label: 'L = 12,45 (cm) ± 0,03' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ghi_1'],
        },
        explain:
          'Kết quả đo luôn viết dạng L = L̄ ± ΔL kèm đơn vị. Cách 2 sai vì dấu "+" chỉ nêu sai lệch về một phía, ' +
          'trong khi giá trị thật có thể lớn hơn hoặc nhỏ hơn L̄. Cách 3 sai vì đặt đơn vị vào giữa, tách rời sai số ' +
          'khỏi đơn vị của nó.',
      },
    ],
    srsCards: [
      {
        hoi: 'Thế nào là phép đo trực tiếp một đại lượng vật lí?',
        dap: 'Là phép đo mà giá trị của đại lượng được đọc trực tiếp trên dụng cụ đo.',
      },
      {
        hoi: 'Làm thế nào để giảm thiểu sai số ngẫu nhiên trong phép đo thực hành?',
        dap: 'Thực hiện đo lặp lại nhiều lần và tính giá trị trung bình.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
