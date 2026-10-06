// apps/dhcb/src/data/appliedKnowledgeData.ts — Kho Dữ Liệu Ứng Dụng Thực Tế Kiến Thức Đã Học
// Liên kết kiến thức SGK phổ thông (Cấp 1 - 2 - 3) với bài toán giải quyết thực tế trong cuộc sống

export type SchoolLevel = 'primary' | 'secondary' | 'high_school' | 'all_ages'
export type SubjectCategory =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'informatics'
  | 'literature'
  | 'economics_law'
  | 'history_geo'

export interface AppliedConcept {
  id: string
  title: string
  subject: SubjectCategory
  level: SchoolLevel
  gradeLabel: string
  topic: string
  theorySummary: string
  intuitivePrinciple: string
  realWorldProblem: string
  industryCareerApp: string
  miniProject: {
    title: string
    duration: string
    steps: string[]
    deliverable: string
  }
  tags: string[]
}

export const APPLIED_KNOWLEDGE_DATABASE: AppliedConcept[] = [
  // 1. TOÁN HỌC CẤP 3: Đạo hàm & Cực trị
  {
    id: 'math_derivative_profit',
    title: 'Đạo Hàm Bậc Nhất — Tìm Điểm Giá Bán Tối Ưu Lợi Nhuận Cho Doanh Nghiệp',
    subject: 'math',
    level: 'high_school',
    gradeLabel: 'Lớp 12',
    topic: 'Giải tích — Khảo sát hàm số & Cực trị',
    theorySummary:
      "Hàm số $y = f(x)$ đạt cực trị tại $x_0$ khi $f'(x_0) = 0$ và đạo hàm đổi dấu qua $x_0$.",
    intuitivePrinciple:
      'Khi bạn tăng giá sản phẩm, bạn lãi nhiều hơn trên mỗi món nhưng lượng khách mua lại giảm đi. Đạo hàm giúp tìm chính xác "điểm cân bằng hoàn hảo" nơi tổng lợi nhuận đạt đỉnh cao nhất mà không sợ bị ế hàng.',
    realWorldProblem:
      'Một quán trà sữa bán 500 ly/ngày ở giá 30k (chi phí vốn 15k). Cứ tăng 2k thì mất 30 khách. Đặt giá bao nhiêu để bỏ túi nhiều tiền lãi nhất mỗi ngày?',
    industryCareerApp:
      'Dynamic Pricing trong các hãng hàng không (Vietnam Airlines), sàn thương mại điện tử (Shopee, Amazon) và ứng dụng gọi xe (Grab, Gojek) khi tự động tăng/giảm giá theo cung cầu.',
    miniProject: {
      title: 'Tối ưu hóa bảng giá gian hàng hội chợ trường',
      duration: '30 phút',
      steps: [
        'Lập bảng khảo sát 20 bạn học về mức giá sẵn sàng mua trà tắc (10k, 15k, 20k, 25k).',
        'Vẽ đồ thị quan hệ giữa Giá bán và Số lượng người mua.',
        'Lập phương trình Lợi nhuận $P(x) = (x - c) \\cdot Q(x)$ và tính đạo hàm tìm đỉnh.',
      ],
      deliverable: 'Mức giá bán tối ưu được chứng minh bằng công thức toán học.',
    },
    tags: ['đạo hàm', 'cực trị', 'kinh doanh', 'tối ưu hóa', 'kinh tế'],
  },

  // 2. TOÁN HỌC CẤP 3: Cấp số nhân & Lãi kép
  {
    id: 'math_geometric_compound_interest',
    title: 'Cấp Số Nhân — Sức Mạnh Lãi Kép & Tự Do Tài Chính 10 Năm',
    subject: 'math',
    level: 'high_school',
    gradeLabel: 'Lớp 11',
    topic: 'Đại số — Cấp số nhân & Dãy số',
    theorySummary:
      'Số hạng tổng quát cấp số nhân: $u_n = u_1 \\cdot q^{n-1}$. Công thức lãi kép: $A = P(1 + r)^n$.',
    intuitivePrinciple:
      'Tiền sinh ra tiền, và tiền lãi của tháng này tiếp tục đẻ ra thêm tiền lãi ở các tháng sau. Ở những năm đầu tăng rất chậm, nhưng sau 10-15 năm đồ thị sẽ dựng đứng như tên lửa.',
    realWorldProblem:
      'Người đi làm 22 tuổi tiết kiệm 3 triệu/tháng đầu tư quỹ chỉ số với lãi suất 10%/năm. Sau 20 năm họ có bao nhiêu tiền so với việc chỉ nhét ống heo 3 triệu/tháng?',
    industryCareerApp:
      'Quản lý quỹ đầu tư (VinaCapital, Dragon Capital), định giá bảo hiểm nhân thọ, thẩm định dự án đầu tư công nghệ và chiến lược tự do tài chính (FIRE).',
    miniProject: {
      title: 'Xây dựng kế hoạch tài chính cá nhân cho tuổi 30',
      duration: '20 phút',
      steps: [
        'Xác định số tiền có thể trích ra đều đặn mỗi tháng (VD: 500k hoặc 2 triệu).',
        'Sử dụng công cụ Simulator Lãi kép trên Đồng Hành để kiểm tra sau 5, 10, 15 năm.',
        'So sánh kết quả có tính lạm phát 4%/năm và không tính lạm phát.',
      ],
      deliverable: 'Biểu đồ dòng tiền cá nhân và cột mốc tự do tài chính.',
    },
    tags: ['lãi kép', 'cấp số nhân', 'tài chính cá nhân', 'đầu tư', 'fire'],
  },

  // 3. VẬT LÝ CẤP 3: Thuyết Tương Đối & Hệ thống GPS
  {
    id: 'physics_relativity_gps',
    title: 'Thuyết Tương Đối Einstein — Lý Do Google Maps & Grab Định Vị Chính Xác Từng Mét',
    subject: 'physics',
    level: 'high_school',
    gradeLabel: 'Lớp 12',
    topic: 'Vật lí hiện đại — Thuyết tương đối hẹp & rộng',
    theorySummary:
      'Vật thể chuyển động nhanh thì thời gian trôi chậm lại ($-7.2\\,\\mu\\text{s}/\\text{ngày}$). Vật ở nơi trường trọng lực yếu hơn thì thời gian trôi nhanh hơn ($+45.8\\,\\mu\\text{s}/\\text{ngày}$).',
    intuitivePrinciple:
      'Vệ tinh GPS bay trên quỹ đạo 20.000 km di chuyển cực nhanh nhưng lại chịu lực hút Trái Đất yếu hơn mặt đất. Kết quả là đồng hồ trên vệ tinh chạy nhanh hơn đồng hồ dưới Trái Đất $38.6$ micro-giây mỗi ngày.',
    realWorldProblem:
      'Nếu các kỹ sư GPS không cài công thức Einstein vào thuật toán vệ tinh, mỗi ngày vị trí bản đồ sẽ bị lệch gần 12 km, khiến bạn gọi xe ở Hà Nội nhưng định vị sang Bắc Ninh!',
    industryCareerApp:
      'Hàng không vũ trụ (NASA, SpaceX), thiết kế hệ thống dẫn đường máy bay không người lái (UAV), công nghệ xe tự hành Tesla và đồng hồ nguyên tử ngân hàng.',
    miniProject: {
      title: 'Mô phỏng độ trôi vị trí vệ tinh không gian',
      duration: '15 phút',
      steps: [
        'Kéo thanh trượt số ngày bay trong mô phỏng GPS.',
        'Quan sát sai số vị trí nhân lên theo phương trình $d = c \\cdot \\Delta t$.',
        'Ghi nhận vì sao lý thuyết thuần túy lại nuôi sống ngành công nghệ nghìn tỷ đô.',
      ],
      deliverable: 'Bản phân tích sai số định vị GPS theo thời gian thực.',
    },
    tags: ['thuyết tương đối', 'gps', 'einstein', 'vũ trụ', 'bản đồ'],
  },

  // 4. VẬT LÝ CẤP 2: Định luật Joule-Lenz & Hóa đơn EVN
  {
    id: 'physics_joule_lenz_electricity',
    title: 'Định Luật Công Suất Điện & Nhiệt Lượng — Chiến Lược Giảm 35% Tiền Điện Hàng Tháng',
    subject: 'physics',
    level: 'secondary',
    gradeLabel: 'Lớp 9',
    topic: 'Điện học — Công và công suất điện',
    theorySummary:
      'Nhiệt lượng tỏa ra: $Q = I^2 \\cdot R \\cdot t$. Điện năng tiêu thụ: $A = P \\cdot t$.',
    intuitivePrinciple:
      'Điều hòa để nhiệt độ càng thấp (18°C) thì máy nén phải chạy liên tục hết công suất tối đa $P_{max}$. Chỉ cần nâng lên 26-27°C kèm 1 quạt cây nhỏ, công suất trung bình giảm một nửa mà phòng vẫn mát lạnh dễ chịu.',
    realWorldProblem:
      'Mùa hè hóa đơn tiền điện gia đình nhảy vọt từ 800k lên 2.5 triệu do rơi vào các bậc thang giá cao (Bậc 5 & 6 của EVN). Làm sao để vừa mát vừa tiết kiệm 700k/tháng?',
    industryCareerApp:
      'Kỹ sư hệ thống cơ điện M&E cho tòa nhà cao tầng, thiết kế năng lượng mặt trời áp mái, tối ưu hóa hệ thống làm mát trung tâm dữ liệu AI.',
    miniProject: {
      title: 'Kiểm toán năng lượng điện cho ngôi nhà của bạn',
      duration: '25 phút',
      steps: [
        'Ghi nhận công suất (Watt) ghi trên nhãn dán của Điều hòa, Tủ lạnh, Bình nóng lạnh và PC.',
        'Ước tính số giờ sử dụng trung bình mỗi ngày.',
        'Chạy Simulator Tiền điện EVN để tìm ra thiết bị "ngốn" nhiều tiền nhất.',
      ],
      deliverable: 'Bảng quy tắc bật/tắt thiết bị giúp giảm 25-35% hóa đơn gia đình.',
    },
    tags: ['tiền điện', 'evn', 'công suất', 'nhiệt lượng', 'tiết kiệm'],
  },

  // 5. HÓA HỌC CẤP 2-3: Nồng độ dung dịch & Pha Cồn 70°
  {
    id: 'chemistry_dilution_alcohol',
    title: 'Nồng Độ Dung Dịch — Vì Sao Cồn 70° Diệt Khuẩn Tốt Hơn Cồn 90°?',
    subject: 'chemistry',
    level: 'secondary',
    gradeLabel: 'Lớp 8 & 9',
    topic: 'Dung dịch — Nồng độ phần trăm và pha loãng',
    theorySummary:
      'Công thức pha loãng: $C_1 \\cdot V_1 = C_2 \\cdot V_2$. Nồng độ phần trăm: $C\\% = \\frac{m_{ct}}{m_{dd}} \\cdot 100\\%$.',
    intuitivePrinciple:
      'Cồn 90° bay hơi quá nhanh và làm đông cứng ngay lập tức lớp vỏ protein bên ngoài của vi khuẩn, vô tình tạo thành một "chiếc khiên" bảo vệ phần lõi bên trong. Cồn 70° có đủ nước để thấm sâu vào bên trong tế bào vi khuẩn và tiêu diệt hoàn toàn.',
    realWorldProblem:
      'Trong đợt dịch hoặc khi khử trùng vết thương, bạn chỉ có 1 chai cồn 90° 500ml. Cần thêm bao nhiêu ml nước đun sôi để nguội để biến nó thành cồn 70° chuẩn y tế?',
    industryCareerApp:
      'Sản xuất dược phẩm, pha chế dung dịch tẩy rửa sinh học, công nghệ mỹ phẩm (kem dưỡng, serum) và quy trình tiệt trùng bệnh viện.',
    miniProject: {
      title: 'Công thức pha chế nước rửa tay khô chuẩn WHO tại nhà',
      duration: '15 phút',
      steps: [
        'Dùng công thức pha loãng $C_1 \\cdot V_1 = C_2 \\cdot V_2$ để tính lượng cồn 96° cần lấy.',
        'Tính toán lượng Glycerin (dưỡng ẩm) và Oxi già $H_2O_2$ (diệt bào tử vi khuẩn).',
        'Ghi chú nhãn dán an toàn và bảo quản tránh xa nguồn lửa.',
      ],
      deliverable: '1 chai cồn sát khuẩn 70° chuẩn tỷ lệ y tế.',
    },
    tags: ['nồng độ', 'pha loãng', 'cồn 70', 'y tế', 'sát khuẩn'],
  },

  // 6. SINH HỌC CẤP 3: Trao Đổi Chất & Bilan Năng Lượng
  {
    id: 'biology_metabolism_tdee',
    title: 'Trao Đổi Chất & Năng Lượng Tế Bào — Cơ Chế Giảm Mỡ Tăng Cơ Khoa Học',
    subject: 'biology',
    level: 'high_school',
    gradeLabel: 'Lớp 10 & 11',
    topic: 'Sinh học tế bào — Chuyển hóa vật chất và năng lượng (ATP)',
    theorySummary:
      'Năng lượng nạp vào (Food Intake) vs Năng lượng tiêu hao (BMR + TEF + NEAT + EAT). Định luật bảo toàn năng lượng trong cơ thể sống.',
    intuitivePrinciple:
      'Cơ thể không thể tự dưng tạo ra mỡ hay làm mất mỡ mà không qua quy luật đốt năng lượng. Mỡ chỉ bị oxy hóa thành $CO_2$ (qua hơi thở 84%) và $H_2O$ (qua mồ hôi/nước tiểu 16%) khi có sự thâm hụt calo bền vững.',
    realWorldProblem:
      'Muốn giảm 3kg mỡ thừa trong 2 tháng một cách an toàn mà không bị mất cơ hay hạ đường huyết, bạn cần ăn bao nhiêu Calo và bao nhiêu gram Protein mỗi ngày?',
    industryCareerApp:
      'Chuyên gia dinh dưỡng lâm sàng, huấn luyện viên thể hình (PT), bác sĩ điều trị tiểu đường/tim mạch và thiết kế thực đơn thể thao chuyên nghiệp.',
    miniProject: {
      title: 'Thiết kế thực đơn cá nhân hóa chuẩn Macro',
      duration: '20 phút',
      steps: [
        'Tính chỉ số BMR và TDEE theo công thức Mifflin-St Jeor trong Simulator.',
        'Chọn mức thâm hụt 300-500 kcal/ngày cho mục tiêu giảm mỡ an toàn.',
        'Phân bổ tỷ lệ Protein (2g/kg), Fat (25% calo) và Carb để duy trì năng lượng học tập.',
      ],
      deliverable: 'Bảng phân bổ dinh dưỡng 3 bữa ăn cân đối theo gram.',
    },
    tags: ['dinh dưỡng', 'tdee', 'bmr', 'giảm cân', 'chuyển hóa năng lượng'],
  },

  // 7. TIN HỌC & AI: Thuật toán Tối ưu hóa Gradient Descent
  {
    id: 'informatics_gradient_descent',
    title: 'Thuật Toán Gradient Descent — Cách Trí Tuệ Nhân Tạo & ChatGPT Học Tập',
    subject: 'informatics',
    level: 'all_ages',
    gradeLabel: 'Tin học & AI',
    topic: 'Khoa học máy tính — Tối ưu hóa và Học máy (Machine Learning)',
    theorySummary: 'Cập nhật trọng số mô hình: $w_{new} = w_{old} - \\alpha \\cdot \\nabla L(w)$.',
    intuitivePrinciple:
      'Tưởng tượng bạn bị bịt mắt và thả xuống một ngọn núi mù sương, bạn muốn đi xuống thung lũng sâu nhất (nơi hàm lỗi nhỏ nhất). Bạn dùng chân dò hướng dốc xuống nhất xung quanh và bước một bước nhỏ theo hướng đó. Lặp lại hàng triệu lần, AI sẽ trở nên thông minh.',
    realWorldProblem:
      'Làm thế nào mà hệ thống nhận diện khuôn mặt trên điện thoại hay thuật toán dịch tự động có thể tự sửa lỗi và ngày càng chính xác sau mỗi lần được huấn luyện?',
    industryCareerApp:
      'Kỹ sư Trí tuệ Nhân tạo (AI Engineer), Khoa học Dữ liệu (Data Scientist), nhà phát triển hệ thống gợi ý cho Netflix, TikTok, Spotify.',
    miniProject: {
      title: 'Thử nghiệm tốc độ học (Learning Rate) của mô hình AI',
      duration: '15 phút',
      steps: [
        'Khám phá cách bước nhảy quá lớn (High Learning Rate) làm AI bị phân kỳ, không bao giờ học được.',
        'Khám phá bước nhảy quá nhỏ làm AI học cực kỳ chậm chạp.',
        'Tìm bước nhảy tối ưu để mô hình hội tụ nhanh chóng.',
      ],
      deliverable: 'Hiểu bản chất cách thức máy học tự điều chỉnh tham số.',
    },
    tags: ['ai', 'machine learning', 'thuật toán', 'gradient descent', 'tin học'],
  },

  // 8. KINH TẾ & PHÁP LUẬT: Hợp đồng lao động & Quyền lợi BHXH
  {
    id: 'economics_labor_contract',
    title: 'Giáo Dục Kinh Tế & Pháp Luật — Đọc Vị Hợp Đồng Lao Động & Lương Net vs Gross',
    subject: 'economics_law',
    level: 'high_school',
    gradeLabel: 'Lớp 11 & 12',
    topic: 'Pháp luật lao động — Hợp đồng, bảo hiểm xã hội và thuế thu nhập cá nhân',
    theorySummary: 'Lương Gross = Lương Net + 10.5% BHXH/BHYT/BHTN + Thuế TNCN lũy tiến từng phần.',
    intuitivePrinciple:
      'Khi nhà tuyển dụng ghi "Lương 15 triệu", đó là Gross (chưa trừ bảo hiểm và thuế) hay Net (tiền thực nhận vào tài khoản)? Hiểu rõ luật giúp bạn không bị thiệt thòi hàng chục triệu đồng tiền thai sản, ốm đau và trợ cấp thất nghiệp sau này.',
    realWorldProblem:
      'Một công ty đề xuất trả lương cơ bản 5 triệu để đóng bảo hiểm xã hội thấp, còn 10 triệu còn lại trả bằng phụ cấp. Bạn sẽ được lợi hay thiệt hại gì nếu gặp tai nạn lao động hoặc khi nghỉ việc?',
    industryCareerApp:
      'Quản trị Nhân sự (HR), Pháp chế doanh nghiệp, Kế toán tiền lương (C&B) và Kỹ năng đàm phán hợp đồng cho mọi người đi làm.',
    miniProject: {
      title: 'So sánh bảng lương Gross sang Net khi phỏng vấn xin việc',
      duration: '20 phút',
      steps: [
        'Nhập mức lương thỏa thuận 12 triệu, 20 triệu, 30 triệu vào bảng phân tích.',
        'Bóc tách 8% BHXH, 1.5% BHYT, 1% BHTN của người lao động.',
        'Tính mức giảm trừ gia cảnh (15,5 triệu/tháng cho bản thân, 6,2 triệu cho mỗi người phụ thuộc) để xem có phải đóng thuế TNCN không.',
      ],
      deliverable: 'Bản phân tích tài chính trước khi đặt bút ký hợp đồng thử việc.',
    },
    tags: ['lương gross net', 'hợp đồng lao động', 'bhxh', 'pháp luật', 'kinh tế'],
  },
]
