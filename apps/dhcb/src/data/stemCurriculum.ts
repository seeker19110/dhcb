// apps/dhcb/src/data/stemCurriculum.ts — Kho dữ liệu học tập chuẩn hóa cho các môn STEM (V2-12)
// Bám sát khung mạch kiến thức GDPT 2018 (Toán, Vật lí, Hóa học, Sinh học)
// Bao gồm đầy đủ 4 khối lớp: Lớp 10, Lớp 11, Lớp 12, Đại học

export interface StemChapter {
  id: string
  title: string
  description: string
  keyFormulas: Array<{ name: string; formula: string; note?: string }>
  sampleProblems: Array<{
    id: string
    title: string
    prompt: string
    difficulty: 'basic' | 'intermediate' | 'advanced'
    solutionSteps: Array<{ title: string; detail: string; formula?: string }>
  }>
}

export interface StemGradeCurriculum {
  grade: 'grade_10' | 'grade_11' | 'grade_12' | 'university'
  gradeLabel: string
  chapters: StemChapter[]
}

export const STEM_CURRICULUM: Record<string, StemGradeCurriculum[]> = {
  mathematics: [
    {
      grade: 'grade_12',
      gradeLabel: 'Lớp 12 (Thi THPTQG)',
      chapters: [
        {
          id: 'm12_c1',
          title: 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
          description:
            'Tính đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất, đường tiệm cận và khảo sát hàm số.',
          keyFormulas: [
            {
              name: 'Điều kiện đơn điệu',
              formula: "f'(x) ≥ 0, ∀x ∈ K ⇒ f(x) đồng biến trên K",
              note: 'Dấu bằng xảy ra tại hữu hạn điểm',
            },
            {
              name: 'Cực trị bậc 3',
              formula: "y = ax^3 + bx^2 + cx + d ⇒ y' = 3ax^2 + 2bx + c = 0",
              note: 'Có 2 cực trị ⇔ b^2 - 3ac > 0',
            },
            { name: 'Tiệm cận ngang', formula: 'lim (x → ±∞) f(x) = y0 ⇒ y = y0 là TCN' },
            { name: 'Tiệm cận đứng', formula: 'lim (x → x0) f(x) = ±∞ ⇒ x = x0 là TCĐ' },
          ],
          sampleProblems: [
            {
              id: 'm12_p1',
              title: 'Tìm cực trị của hàm số bậc ba',
              prompt: 'Tìm tất cả các giá trị cực trị của hàm số y = x^3 - 3x^2 + 2.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Tập xác định & Đạo hàm',
                  detail: 'Tập xác định D = R.',
                  formula: "y' = 3x^2 - 6x = 3x(x - 2)",
                },
                {
                  title: 'Bước 2: Tìm nghiệm đạo hàm',
                  detail: "y' = 0 ⇔ 3x(x - 2) = 0",
                  formula: 'x = 0 hoặc x = 2',
                },
                {
                  title: 'Bước 3: Lập bảng biến thiên',
                  detail: "y' > 0 trên (-∞; 0) và (2; +∞); y' < 0 trên (0; 2).",
                },
                {
                  title: 'Bước 4: Kết luận',
                  detail:
                    'Hàm số đạt cực đại tại x = 0, y_CĐ = 2; đạt cực tiểu tại x = 2, y_CT = -2.',
                },
              ],
            },
          ],
        },
        {
          id: 'm12_c2',
          title: 'Chương 2: Nguyên hàm, Tích phân và Ứng dụng',
          description:
            'Định nghĩa nguyên hàm, các phương pháp tính tích phân, ứng dụng tính diện tích và thể tích.',
          keyFormulas: [
            { name: 'Tích phân từng phần', formula: '∫ u dv = u*v - ∫ v du' },
            { name: 'Diện tích hình phẳng', formula: 'S = ∫ |f(x) - g(x)| dx từ a đến b' },
            { name: 'Thể tích khối tròn xoay', formula: 'V = π * ∫ [f(x)]^2 dx từ a đến b' },
          ],
          sampleProblems: [
            {
              id: 'm12_p2',
              title: 'Tính tích phân từng phần',
              prompt: 'Tính tích phân I = ∫ (2x + 1) * e^x dx từ 0 đến 1.',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Đặt u và dv',
                  detail: 'Đặt u = 2x + 1 ⇒ du = 2 dx\nĐặt dv = e^x dx ⇒ v = e^x',
                },
                {
                  title: 'Bước 2: Áp dụng công thức',
                  detail: 'I = (2x + 1)*e^x |[0..1] - ∫ 2*e^x dx |[0..1]',
                  formula: 'I = (3e - 1) - 2(e - 1) = e + 1',
                },
                { title: 'Bước 3: Kết luận', detail: 'Giá trị tích phân I = e + 1.' },
              ],
            },
          ],
        },
        {
          id: 'm12_c3',
          title: 'Chương 3: Phương pháp tọa độ trong không gian Oxyz',
          description:
            'Hệ trục tọa độ, phương trình mặt phẳng, phương trình đường thẳng và phương trình mặt cầu.',
          keyFormulas: [
            {
              name: 'Mặt cầu tâm I(a,b,c) bán kính R',
              formula: '(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2',
            },
            {
              name: 'Khoảng cách từ điểm M0 đến mặt phẳng (P)',
              formula: 'd(M0, (P)) = |A*x0 + B*y0 + C*z0 + D| / √(A^2 + B^2 + C^2)',
            },
          ],
          sampleProblems: [
            {
              id: 'm12_p3',
              title: 'Viết phương trình mặt phẳng đi qua 1 điểm và vuông góc đường thẳng',
              prompt:
                'Trong không gian Oxyz, viết phương trình mặt phẳng (P) đi qua điểm A(1, -2, 3) và nhận vectơ n = (2, -1, 4) làm vectơ pháp tuyến.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Dạng phương trình mặt phẳng',
                  detail: 'Mặt phẳng đi qua A(x0, y0, z0) có VTPT n = (A, B, C) có dạng:',
                  formula: 'A(x - x0) + B(y - y0) + C(z - z0) = 0',
                },
                {
                  title: 'Bước 2: Thay số tọa độ',
                  detail: 'Thay A(1, -2, 3) và n = (2, -1, 4):',
                  formula: '2(x - 1) - 1(y + 2) + 4(z - 3) = 0 ⇔ 2x - y + 4z - 16 = 0',
                },
                {
                  title: 'Bước 3: Kết luận',
                  detail: 'Phương trình mặt phẳng (P) là: 2x - y + 4z - 16 = 0.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_11',
      gradeLabel: 'Lớp 11',
      chapters: [
        {
          id: 'm11_c1',
          title: 'Hàm số lượng giác và Phương trình lượng giác',
          description:
            'Công thức biến đổi lượng giác, hàm số sin, cos, tan, cot và các phương trình lượng giác cơ bản.',
          keyFormulas: [
            { name: 'sin(x) = sin(α)', formula: 'x = α + k2π hoặc x = π - α + k2π (k ∈ Z)' },
            { name: 'cos(x) = cos(α)', formula: 'x = ±α + k2π (k ∈ Z)' },
          ],
          sampleProblems: [
            {
              id: 'm11_p1',
              title: 'Giải phương trình lượng giác bậc 2',
              prompt: 'Giải phương trình: 2*cos^2(x) + 3*sin(x) - 3 = 0.',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Đưa về cùng một hàm sin',
                  detail: 'Sử dụng cos^2(x) = 1 - sin^2(x):',
                  formula: '2(1 - sin^2(x)) + 3*sin(x) - 3 = 0 ⇔ -2*sin^2(x) + 3*sin(x) - 1 = 0',
                },
                {
                  title: 'Bước 2: Giải nghiệm sin(x)',
                  detail: 'Giải phương trình bậc 2 theo sin(x):',
                  formula: 'sin(x) = 1 hoặc sin(x) = 1/2',
                },
                {
                  title: 'Bước 3: Kết luận họ nghiệm',
                  detail:
                    '• sin(x) = 1 ⇔ x = π/2 + k2π\n• sin(x) = 1/2 ⇔ x = π/6 + k2π hoặc x = 5π/6 + k2π (k ∈ Z).',
                },
              ],
            },
          ],
        },
        {
          id: 'm11_c2',
          title: 'Dãy số, Cấp số cộng và Cấp số nhân',
          description: 'Quy luật dãy số, số hạng tổng quát, tính tổng n số hạng đầu tiên.',
          keyFormulas: [
            { name: 'Số hạng tổng quát CSC', formula: 'un = u1 + (n - 1)*d' },
            {
              name: 'Tổng n số hạng đầu CSC',
              formula: 'Sn = n*(u1 + un)/2 = n*[2*u1 + (n - 1)*d]/2',
            },
            { name: 'Số hạng tổng quát CSN', formula: 'un = u1 * q^(n - 1)' },
          ],
          sampleProblems: [
            {
              id: 'm11_p2',
              title: 'Tìm số hạng đầu và công sai cấp số cộng',
              prompt:
                'Cho cấp số cộng (un) có u3 = 8 và u7 = 20. Tìm số hạng đầu u1 và công sai d.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Lập hệ phương trình',
                  detail: 'Ta có:\nu3 = u1 + 2d = 8\nu7 = u1 + 6d = 20',
                },
                {
                  title: 'Bước 2: Giải hệ',
                  detail:
                    'Trừ phương trình 2 cho phương trình 1: 4d = 12 ⇒ d = 3. Thay vào pt 1: u1 = 8 - 2*3 = 2.',
                  formula: 'u1 = 2, d = 3',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_10',
      gradeLabel: 'Lớp 10',
      chapters: [
        {
          id: 'm10_c1',
          title: 'Mệnh đề & Tập hợp, Bất phương trình bậc hai',
          description: 'Mệnh đề logic, các phép toán tập hợp và dấu của tam thức bậc hai.',
          keyFormulas: [
            { name: 'Tam thức bậc hai', formula: 'f(x) = ax^2 + bx + c (a ≠ 0)' },
            { name: 'Điều kiện cùng dấu a', formula: 'Δ < 0 ⇒ a*f(x) > 0, ∀x ∈ R' },
          ],
          sampleProblems: [
            {
              id: 'm10_p1',
              title: 'Giải bất phương trình bậc hai',
              prompt: 'Giải bất phương trình: x^2 - 5x + 6 > 0.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Tìm nghiệm của tam thức',
                  detail: 'x^2 - 5x + 6 = 0 ⇔ (x - 2)(x - 3) = 0 ⇔ x = 2 hoặc x = 3.',
                },
                {
                  title: 'Bước 2: Xét dấu tam thức',
                  detail: 'Hệ số a = 1 > 0, nên tam thức dương ngoài khoảng hai nghiệm.',
                  formula: 'Tập nghiệm: S = (-∞; 2) ∪ (3; +∞)',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'university',
      gradeLabel: 'Đại học & Cao cấp (gồm Toán ứng dụng trong Lập trình)',
      chapters: [
        {
          id: 'm_uni_c1',
          title: 'Giải tích & Đại số tuyến tính đại cương',
          description:
            'Chuỗi số, phương trình vi phân, ma trận, định thức và hệ phương trình tuyến tính.',
          keyFormulas: [
            { name: 'Định thức ma trận 2x2', formula: 'det([[a,b],[c,d]]) = ad - bc' },
            {
              name: 'Khai triển Maclaurin của e^x',
              formula: 'e^x = 1 + x + x^2/2! + ... + x^n/n! + o(x^n)',
            },
          ],
          sampleProblems: [
            {
              id: 'm_uni_p1',
              title: 'Tính định thức ma trận cấp 3',
              prompt: 'Tính định thức ma trận A = [[1, 2, 3], [0, 4, 5], [1, 0, 6]].',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Khai triển theo dòng 1 hoặc cột 1',
                  detail: 'det(A) = 1*(4*6 - 5*0) - 2*(0*6 - 5*1) + 3*(0*0 - 4*1)',
                  formula: 'det(A) = 24 - 2*(-5) + 3*(-4) = 24 + 10 - 12 = 22',
                },
              ],
            },
          ],
        },
        // Nhóm chương `mfc_*` (Toán ứng dụng trong Lập trình) nằm CHUNG mục `university`:
        // giao diện chọn khối bằng `curriculumList.find(g => g.grade === selectedGrade)` nên
        // hai mục cùng `grade: 'university'` sẽ khiến mục thứ hai không bao giờ hiển thị được.
        {
          id: 'mfc_c1',
          title: 'Toán rời rạc nền tảng — biểu diễn số và logic',
          description:
            'Hệ nhị phân, số bù 2, dấu phẩy động IEEE 754, đại số Boolean, số học modulo và cách đọc Big-O bằng ngôn ngữ toán.',
          keyFormulas: [
            {
              name: 'Giá trị số bù 2 trên n bit',
              formula: 'V = -b_(n-1) * 2^(n-1) + Σ (b_i * 2^i), i = 0..n-2',
              note: 'Bit cao nhất mang trọng số ÂM — đó là lý do phép trừ thành phép cộng',
            },
            {
              name: 'Luật De Morgan',
              formula: 'NOT(A AND B) = (NOT A) OR (NOT B)',
              note: 'Dùng để rút gọn điều kiện if lồng nhau',
            },
            {
              name: 'Tổng cấp số cộng trong vòng lặp lồng',
              formula: '1 + 2 + ... + n = n(n + 1)/2 = O(n^2)',
            },
          ],
          sampleProblems: [
            {
              id: 'mfc_p1',
              title: 'Biểu diễn số âm bằng bù 2 và tính XOR',
              prompt:
                'Trên 8 bit, hãy biểu diễn -5 theo bù 2, sau đó tính -5 XOR 12 và đọc kết quả ra số thập phân có dấu.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Viết |−5| dưới dạng nhị phân 8 bit',
                  detail: '5 = 00000101.',
                },
                {
                  title: 'Bước 2: Đảo bit rồi cộng 1',
                  detail: 'Đảo 00000101 được 11111010; cộng 1 được 11111011.',
                  formula: '-5 = 11111011 (bù 2, 8 bit)',
                },
                {
                  title: 'Bước 3: Viết 12 và thực hiện XOR theo từng bit',
                  detail: '12 = 00001100. XOR: 11111011 ⊕ 00001100 = 11110111.',
                },
                {
                  title: 'Bước 4: Đọc kết quả về số có dấu',
                  detail:
                    'Bit cao nhất bằng 1 nên là số âm. Đảo bit được 00001000, cộng 1 được 00001001 = 9.',
                  formula: '-5 XOR 12 = 11110111 = -9',
                },
              ],
            },
          ],
        },
        {
          id: 'mfc_c2',
          title: 'Tổ hợp và xác suất cho lập trình viên',
          description:
            'Đếm số trường hợp trước khi vét cạn, xác suất va chạm bảng băm, kỳ vọng, số giả ngẫu nhiên và thống kê mô tả khi đo hiệu năng.',
          keyFormulas: [
            { name: 'Tổ hợp chập k của n', formula: 'C(n, k) = n! / (k! * (n - k)!)' },
            {
              name: 'Xác suất có ít nhất một va chạm (bài toán sinh nhật)',
              formula: 'P = 1 - (N! / ((N - k)! * N^k))',
              note: 'N là số ô của bảng băm, k là số khoá đã chèn',
            },
            {
              name: 'Xấp xỉ nhanh xác suất va chạm',
              formula: 'P ≈ 1 - e^(-k(k-1) / (2N))',
              note: 'Dùng khi k lớn, tránh tính giai thừa tràn số',
            },
          ],
          sampleProblems: [
            {
              id: 'mfc_p2',
              title: 'Xác suất va chạm của một bảng băm',
              prompt:
                'Một bảng băm có N = 365 ô và hàm băm phân bố đều. Tính xác suất có ít nhất một va chạm khi chèn k = 23 khoá khác nhau.',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Tính xác suất KHÔNG có va chạm',
                  detail:
                    'Khoá thứ i chỉ được rơi vào ô còn trống, nên nhân dồn tỉ lệ ô còn trống.',
                  formula: 'Q = (365/365) * (364/365) * ... * (343/365)',
                },
                {
                  title: 'Bước 2: Tính giá trị Q',
                  detail: 'Nhân 23 thừa số trên cho Q ≈ 0.4927.',
                },
                {
                  title: 'Bước 3: Lấy phần bù',
                  detail: 'Xác suất có va chạm là phần còn lại.',
                  formula: 'P = 1 - Q ≈ 0.5073 (khoảng 50.7%)',
                },
                {
                  title: 'Bước 4: Ý nghĩa với code',
                  detail:
                    'Chỉ 23 khoá trên 365 ô đã cho hơn 50% khả năng va chạm, nên bảng băm BẮT BUỘC phải có cơ chế xử lý va chạm, không được coi là trường hợp hiếm.',
                },
              ],
            },
          ],
        },
        {
          id: 'mfc_c3',
          title: 'Đại số tuyến tính ứng dụng trong đồ hoạ và dữ liệu',
          description:
            'Vector và tích vô hướng, ma trận biến đổi 2D, toạ độ thuần nhất, hệ phương trình tuyến tính và ý tưởng vector riêng.',
          keyFormulas: [
            {
              name: 'Ma trận xoay góc θ trong mặt phẳng',
              formula: 'R(θ) = [[cos θ, -sin θ], [sin θ, cos θ]]',
              note: 'Xoay ngược chiều kim đồng hồ quanh gốc toạ độ',
            },
            { name: 'Tích vô hướng và góc', formula: 'u · v = |u| * |v| * cos(α)' },
            {
              name: 'Toạ độ thuần nhất gộp tịnh tiến',
              formula: 'T = [[1, 0, tx], [0, 1, ty], [0, 0, 1]]',
              note: 'Nhờ chiều thứ ba, tịnh tiến trở thành phép NHÂN ma trận',
            },
          ],
          sampleProblems: [
            {
              id: 'mfc_p3',
              title: 'Áp ma trận xoay 2D lên toạ độ một điểm',
              prompt:
                'Điểm P(3; 4) được xoay 90 độ ngược chiều kim đồng hồ quanh gốc toạ độ, sau đó tịnh tiến thêm vector (2; -1). Tìm toạ độ điểm cuối.',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Viết ma trận xoay với θ = 90°',
                  detail: 'cos 90° = 0 và sin 90° = 1.',
                  formula: 'R = [[0, -1], [1, 0]]',
                },
                {
                  title: 'Bước 2: Nhân ma trận với vector toạ độ',
                  detail: "x' = 0*3 + (-1)*4 = -4; y' = 1*3 + 0*4 = 3.",
                  formula: "P' = (-4; 3)",
                },
                {
                  title: 'Bước 3: Cộng vector tịnh tiến',
                  detail: 'P" = (-4 + 2; 3 + (-1)).',
                  formula: 'P" = (-2; 2)',
                },
                {
                  title: 'Bước 4: Kiểm tra bất biến',
                  detail:
                    "Phép xoay giữ nguyên độ dài: |P| = 5 và |P'| = √((-4)^2 + 3^2) = 5. Đây là bất biến nên dùng làm test canh khi cài bằng code.",
                },
              ],
            },
          ],
        },
        {
          id: 'mfc_c4',
          title: 'Giải tích và tối ưu cho AI/ML',
          description:
            'Đạo hàm và gradient, thuật toán gradient descent, hàm mất mát, đạo hàm riêng và ý tưởng lan truyền ngược.',
          keyFormulas: [
            {
              name: 'Bước cập nhật gradient descent',
              formula: "x_(t+1) = x_t - η * f'(x_t)",
              note: 'η là tốc độ học; quá lớn thì phân kỳ, quá nhỏ thì hội tụ chậm',
            },
            {
              name: 'Sai số bình phương trung bình',
              formula: 'MSE = (1/n) * Σ (y_i - ŷ_i)^2',
            },
            {
              name: 'Kiểm gradient bằng sai phân hữu hạn',
              formula: "f'(x) ≈ (f(x + h) - f(x - h)) / (2h)",
              note: 'h nhỏ (ví dụ 1e-5); dùng để bắt lỗi cài đặt đạo hàm',
            },
          ],
          sampleProblems: [
            {
              id: 'mfc_p4',
              title: 'Một bước gradient descent trên hàm bậc hai',
              prompt:
                'Cho f(x) = x^2 - 4x + 7, điểm khởi đầu x_0 = 0 và tốc độ học η = 0.1. Tính x_1, x_2 và cho biết dãy đang tiến về đâu.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Tính đạo hàm',
                  detail: 'Đạo hàm của hàm bậc hai này là một hàm bậc nhất.',
                  formula: "f'(x) = 2x - 4",
                },
                {
                  title: 'Bước 2: Cập nhật lần 1',
                  detail: "f'(0) = -4, đi ngược hướng gradient nên x tăng.",
                  formula: 'x_1 = 0 - 0.1 * (-4) = 0.4',
                },
                {
                  title: 'Bước 3: Cập nhật lần 2',
                  detail: "f'(0.4) = 2*0.4 - 4 = -3.2.",
                  formula: 'x_2 = 0.4 - 0.1 * (-3.2) = 0.72',
                },
                {
                  title: 'Bước 4: Kết luận',
                  detail:
                    "Cực tiểu thật nằm ở f'(x) = 0 ⇔ x = 2. Dãy 0 → 0.4 → 0.72 đang tiến dần về 2; hàm lồi nên chỉ có một cực tiểu và thuật toán chắc chắn hội tụ với η đủ nhỏ.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  physics: [
    {
      grade: 'grade_12',
      gradeLabel: 'Lớp 12 (Thi THPTQG)',
      chapters: [
        {
          id: 'p12_c1',
          title: 'Chương 1: Dao động cơ học',
          description:
            'Dao động điều hòa, con lắc lò xo, con lắc đơn, dao động tắt dần, cưỡng bức và cộng hưởng.',
          keyFormulas: [
            { name: 'Phương trình dao động', formula: 'x = A*cos(ωt + φ)' },
            { name: 'Vận tốc & Gia tốc', formula: 'v = -ω*A*sin(ωt + φ), a = -ω^2*x' },
            { name: 'Chu kỳ con lắc lò xo', formula: 'T = 2π * √(m / k)' },
            { name: 'Chu kỳ con lắc đơn', formula: 'T = 2π * √(l / g)' },
          ],
          sampleProblems: [
            {
              id: 'p12_p1',
              title: 'Xác định chu kỳ và vận tốc cực đại của con lắc lò xo',
              prompt:
                'Một con lắc lò xo có k = 50 N/m, m = 200g. Kéo vật lệch khỏi VTCB 4 cm rồi buông nhẹ. Tính chu kỳ T và vận tốc cực đại.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Đổi đơn vị & Tần số góc',
                  detail: 'm = 200g = 0.2 kg; A = 4 cm = 0.04 m.',
                  formula: 'ω = √(k / m) = √(50 / 0.2) = √250 ≈ 15.81 (rad/s)',
                },
                {
                  title: 'Bước 2: Chu kỳ dao động',
                  detail: 'Áp dụng công thức chu kỳ:',
                  formula: 'T = 2π / ω = 2π / 15.81 ≈ 0.397 (s)',
                },
                {
                  title: 'Bước 3: Vận tốc cực đại',
                  detail: 'Vận tốc cực đại qua VTCB:',
                  formula: 'v_max = ω*A = 15.81 * 0.04 = 0.632 (m/s) = 63.2 (cm/s)',
                },
              ],
            },
          ],
        },
        {
          id: 'p12_c2',
          title: 'Chương 2: Sóng cơ và Sóng âm',
          description:
            'Sự truyền sóng, giao thoa sóng, sóng dừng và các đặc trưng vật lý/sinh lý của âm.',
          keyFormulas: [
            { name: 'Bước sóng', formula: 'λ = v * T = v / f' },
            { name: 'Điều kiện cực đại giao thoa', formula: 'd2 - d1 = k*λ (k ∈ Z)' },
            { name: 'Mức cường độ âm', formula: 'L (dB) = 10 * lg(I / I0) với I0 = 10^-12 W/m^2' },
          ],
          sampleProblems: [
            {
              id: 'p12_p2',
              title: 'Tính bước sóng và khoảng cách giữa 2 cực đại giao thoa',
              prompt:
                'Hai nguồn kết hợp cùng pha phát sóng có tần số f = 50 Hz. Vận tốc truyền sóng v = 2 m/s. Tính bước sóng và khoảng vân giao thoa trên đoạn nối 2 nguồn.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Tính bước sóng',
                  detail: 'Áp dụng công thức bước sóng:',
                  formula: 'λ = v / f = 2 / 50 = 0.04 (m) = 4 (cm)',
                },
                {
                  title: 'Bước 2: Khoảng cách giữa 2 cực đại liên tiếp',
                  detail: 'Trên đoạn nối hai nguồn kết hợp, hai cực đại liên tiếp cách nhau λ/2:',
                  formula: 'd = λ / 2 = 4 / 2 = 2 (cm)',
                },
              ],
            },
          ],
        },
        {
          id: 'p12_c3',
          title: 'Chương 3: Dòng điện xoay chiều',
          description: 'Mạch RLC nối tiếp, cộng hưởng điện, công suất và truyền tải điện năng.',
          keyFormulas: [
            { name: 'Tổng trở mạch RLC', formula: 'Z = √[R^2 + (ZL - ZC)^2]' },
            { name: 'Cảm kháng & Dung kháng', formula: 'ZL = ω*L, ZC = 1 / (ω*C)' },
            { name: 'Công suất tiêu thụ', formula: 'P = U * I * cos(φ) = I^2 * R' },
          ],
          sampleProblems: [
            {
              id: 'p12_p3',
              title: 'Tính tổng trở và công suất mạch RLC',
              prompt:
                'Mạch RLC có R = 40 Ω, ZL = 70 Ω, ZC = 30 Ω. Điện áp hiệu dụng U = 120V. Tính công suất P.',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Tính tổng trở Z',
                  detail: 'Z = √[40^2 + (70 - 30)^2] = √[1600 + 1600] = 40√2 (Ω)',
                },
                {
                  title: 'Bước 2: Tính cường độ dòng điện hiệu dụng',
                  detail: 'I = U / Z = 120 / (40√2) = 3 / √2 (A)',
                },
                {
                  title: 'Bước 3: Tính công suất tiêu thụ',
                  detail: 'P = I^2 * R = (3 / √2)^2 * 40 = (9 / 2) * 40 = 180 (W)',
                  formula: 'P = 180 W',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_11',
      gradeLabel: 'Lớp 11',
      chapters: [
        {
          id: 'p11_c1',
          title: 'Điện trường & Định luật Ohm toàn mạch',
          description:
            'Lực tương tác tĩnh điện Coulomb, cường độ điện trường, suất điện động và định luật Ohm.',
          keyFormulas: [
            { name: 'Định luật Coulomb', formula: 'F = k * |q1*q2| / (ε*r^2) với k = 9*10^9' },
            { name: 'Định luật Ohm toàn mạch', formula: 'I = E / (R_ngoài + r)' },
          ],
          sampleProblems: [
            {
              id: 'p11_p1',
              title: 'Tính cường độ dòng điện trong toàn mạch',
              prompt:
                'Nguồn điện có E = 12V, r = 1 Ω nối với điện trở ngoài R = 5 Ω. Tính dòng điện I.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Áp dụng định luật Ohm toàn mạch',
                  detail: 'I = E / (R + r) = 12 / (5 + 1) = 2 (A)',
                  formula: 'I = 2 A',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_10',
      gradeLabel: 'Lớp 10',
      chapters: [
        {
          id: 'p10_c1',
          title: 'Động học chất điểm & Ba định luật Newton',
          description:
            'Chuyển động thẳng biến đổi đều, rơi tự do, tổng hợp lực và định luật Newton.',
          keyFormulas: [
            { name: 'Vận tốc biến đổi đều', formula: 'v = v0 + a*t' },
            { name: 'Công thức độc lập thời gian', formula: 'v^2 - v0^2 = 2*a*s' },
            { name: 'Định luật II Newton', formula: 'F_hợp_lực = m * a' },
          ],
          sampleProblems: [
            {
              id: 'p10_p1',
              title: 'Tính quãng đường đi được khi hãm phanh',
              prompt:
                'Xe đang chạy với vận tốc 20 m/s thì hãm phanh chuyển động chậm dần đều với gia tốc a = -2 m/s^2. Tính quãng đường xe chạy đến khi dừng hẳn.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Khi dừng lại v = 0',
                  detail: 'Áp dụng công thức v^2 - v0^2 = 2*a*s:',
                  formula: '0^2 - 20^2 = 2 * (-2) * s ⇔ -400 = -4*s ⇒ s = 100 (m)',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'university',
      gradeLabel: 'Đại học & Cao cấp',
      chapters: [
        {
          id: 'p_uni_c1',
          title: 'Vật lí đại cương & Thuyết tương đối',
          description:
            'Cơ học giải tích Lagrangian, điện từ học Maxwell và hiệu ứng Doppler tương đối tính.',
          keyFormulas: [
            { name: 'Năng lượng nghỉ Einstein', formula: 'E0 = m0 * c^2' },
            {
              name: 'Phương trình Maxwell',
              formula: '∇ · E = ρ / ε0, ∇ × B = μ0*J + μ0*ε0*(∂E/∂t)',
            },
          ],
          sampleProblems: [
            {
              id: 'p_uni_p1',
              title: 'Tính năng lượng toàn phần tương đối tính',
              prompt:
                'Một hạt có khối lượng nghỉ m0 = 10^-27 kg chuyển động với vận tốc v = 0.8c. Tính năng lượng toàn phần E.',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Hệ số Lorentz γ',
                  detail: 'γ = 1 / √(1 - (v/c)^2) = 1 / √(1 - 0.64) = 1 / 0.6 = 5/3',
                },
                {
                  title: 'Bước 2: Năng lượng E = γ * m0 * c^2',
                  detail:
                    'E = (5/3) * 10^-27 * (3*10^8)^2 = (5/3) * 10^-27 * 9*10^16 = 1.5 * 10^-10 (J)',
                  formula: 'E = 1.5 * 10^-10 J',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  chemistry: [
    {
      grade: 'grade_12',
      gradeLabel: 'Lớp 12 (Thi THPTQG)',
      chapters: [
        {
          id: 'c12_c1',
          title: 'Chương 1: Ester - Lipid',
          description:
            'Cấu tạo, danh pháp, tính chất vật lý & hóa học (phản ứng thủy phân, xà phòng hóa), chất béo và ứng dụng.',
          keyFormulas: [
            { name: 'Este no, đơn chức, mạch hở', formula: 'CnH2nO2 (n ≥ 2)' },
            { name: 'Phản ứng xà phòng hóa', formula: "RCOOR' + NaOH → RCOONa + R'OH" },
            {
              name: 'Thủy phân chất béo (Triglyceride)',
              formula: '(RCOO)3C3H5 + 3NaOH → 3RCOONa + C3H5(OH)3 (Glycerol)',
            },
          ],
          sampleProblems: [
            {
              id: 'c12_p1',
              title: 'Tính khối lượng muối trong phản ứng xà phòng hóa este',
              prompt:
                'Xà phòng hóa hoàn toàn 8.8g Etyl Axetat (CH3COOC2H5) bằng dung dịch NaOH vừa đủ. Cô cạn dung dịch sau phản ứng thu được m gam muối khan. Tính m.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Tính số mol este',
                  detail: 'M(CH3COOC2H5) = 12*4 + 8 + 32 = 88 g/mol.',
                  formula: 'n_este = 8.8 / 88 = 0.1 (mol)',
                },
                {
                  title: 'Bước 2: Phương trình hóa học',
                  detail: 'CH3COOC2H5 + NaOH → CH3COONa + C2H5OH',
                  formula: 'n_muối(CH3COONa) = n_este = 0.1 (mol)',
                },
                {
                  title: 'Bước 3: Tính khối lượng muối',
                  detail: 'M(CH3COONa) = 15 + 12 + 32 + 23 = 82 g/mol.',
                  formula: 'm = 0.1 * 82 = 8.2 (gam)',
                },
              ],
            },
          ],
        },
        {
          id: 'c12_c2',
          title: 'Chương 2: Kim loại & Hóa học vô cơ nâng cao',
          description: 'Dãy điện hóa, ăn mòn kim loại, kim loại kiềm, kiềm thổ, nhôm, sắt và đồng.',
          keyFormulas: [
            { name: 'Định luật Faraday', formula: 'm = (A * I * t) / (n * F) với F = 96500 C/mol' },
            { name: 'Bảo toàn electron', formula: 'Σ mol e nhường = Σ mol e nhận' },
          ],
          sampleProblems: [
            {
              id: 'c12_p2',
              title: 'Bảo toàn electron khi kim loại tác dụng với HNO3',
              prompt:
                'Hòa tan hoàn toàn 5.6g Fe vào dung dịch HNO3 loãng dư thu được V lít khí NO (đktc, sản phẩm khử duy nhất). Tính V.',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Tính mol Fe',
                  detail: 'n_Fe = 5.6 / 56 = 0.1 (mol)',
                },
                {
                  title: 'Bước 2: Quá trình nhường - nhận electron',
                  detail:
                    'Fe → Fe(+3) + 3e : 0.1 mol Fe nhường 0.3 mol e\nN(+5) + 3e → N(+2) (NO) : n_e nhận = 3 * n_NO',
                },
                {
                  title: 'Bước 3: Bảo toàn electron và tính V',
                  detail: '3 * n_NO = 0.3 ⇒ n_NO = 0.1 (mol)\nV = 0.1 * 22.4 = 2.24 (lít)',
                  formula: 'V = 2.24 lít',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_11',
      gradeLabel: 'Lớp 11',
      chapters: [
        {
          id: 'c11_c1',
          title: 'Cân bằng hóa học & Phản ứng Oxi hóa - Khử',
          description: 'Hằng số cân bằng Kc, nguyên lý Le Chatelier, pH dung dịch và sự điện ly.',
          keyFormulas: [
            { name: 'pH dung dịch', formula: 'pH = -lg[H+] ; pH + pOH = 14' },
            {
              name: 'Hằng số cân bằng',
              formula: 'aA + bB ⇌ cC + dD ⇒ Kc = ([C]^c * [D]^d) / ([A]^a * [B]^b)',
            },
          ],
          sampleProblems: [
            {
              id: 'c11_p1',
              title: 'Tính pH của dung dịch axit mạnh',
              prompt: 'Tính pH của dung dịch HCl 0.01M.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Điện ly hoàn toàn',
                  detail: 'HCl → H+ + Cl- ⇒ [H+] = 0.01M = 10^-2 M.',
                },
                {
                  title: 'Bước 2: Tính pH',
                  detail: 'pH = -lg(10^-2) = 2.',
                  formula: 'pH = 2',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_10',
      gradeLabel: 'Lớp 10',
      chapters: [
        {
          id: 'c10_c1',
          title: 'Cấu tạo nguyên tử & Bảng tuần hoàn',
          description:
            'Hạt electron, proton, neutron, cấu hình electron và quy luật biến đổi tuần hoàn.',
          keyFormulas: [
            { name: 'Số khối nguyên tử', formula: 'A = Z + N (Z: proton, N: neutron)' },
          ],
          sampleProblems: [
            {
              id: 'c10_p1',
              title: 'Xác định số hạt cơ bản của nguyên tử',
              prompt:
                'Tổng số hạt p, n, e trong nguyên tử X là 40. Số hạt mang điện nhiều hơn số hạt không mang điện là 12. Tìm Z và A.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Lập hệ phương trình',
                  detail: '2Z + N = 40 (1)\n2Z - N = 12 (2)',
                },
                {
                  title: 'Bước 2: Giải hệ',
                  detail:
                    'Cộng (1) và (2): 4Z = 52 ⇒ Z = 13 (Al). Thay vào (1): N = 40 - 26 = 14. Số khối A = 13 + 14 = 27.',
                  formula: 'Z = 13, A = 27 (Nhôm - Al)',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'university',
      gradeLabel: 'Đại học & Cao cấp',
      chapters: [
        {
          id: 'c_uni_c1',
          title: 'Hóa lý & Nhiệt động lực học hóa học',
          description: 'Năng lượng tự do Gibbs (ΔG), Entanpi (ΔH), Entropi (ΔS) và động hóa học.',
          keyFormulas: [
            { name: 'Năng lượng tự do Gibbs', formula: 'ΔG = ΔH - T * ΔS' },
            { name: 'Điều kiện tự diễn biến', formula: 'ΔG < 0 (Phản ứng tự xảy ra ở nhiệt độ T)' },
          ],
          sampleProblems: [
            {
              id: 'c_uni_p1',
              title: 'Xét khả năng tự diễn biến của phản ứng theo ΔG',
              prompt:
                'Một phản ứng có ΔH = -50 kJ/mol, ΔS = -100 J/(mol·K) ở T = 298 K. Phản ứng có tự phát không?',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Đồng nhất đơn vị',
                  detail: 'ΔH = -50 000 J/mol; T = 298 K; ΔS = -100 J/(mol·K)',
                },
                {
                  title: 'Bước 2: Tính ΔG',
                  detail:
                    'ΔG = -50 000 - (298 * -100) = -50 000 + 29 800 = -20 200 J/mol = -20.2 kJ/mol < 0.',
                  formula: 'ΔG = -20.2 kJ/mol < 0 ⇒ Phản ứng tự diễn biến ở 298 K',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  biology: [
    {
      grade: 'grade_12',
      gradeLabel: 'Lớp 12 (Thi THPTQG)',
      chapters: [
        {
          id: 'b12_c1',
          title: 'Chương 1: Cơ chế di truyền và biến dị',
          description:
            'Cấu trúc và nhân đôi DNA, phiên mã, dịch mã, điều hòa hoạt động của gen và đột biến gen.',
          keyFormulas: [
            { name: 'Chiều dài phân tử DNA', formula: 'L = (N / 2) * 3.4 Å (1 Å = 10^-4 μm)' },
            { name: 'Tổng số liên kết hydro', formula: 'H = 2A + 3G = 2T + 3X' },
            { name: 'Số bộ ba mã hóa (Codon)', formula: 'Số codon = N_mRNA / 3' },
          ],
          sampleProblems: [
            {
              id: 'b12_p1',
              title: 'Tính số liên kết Hydro và chiều dài của gen',
              prompt:
                'Một gen có 3000 nucleotide, trong đó có 600 nucleotide loại A. Tính chiều dài gen và tổng số liên kết hydro của gen đó.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Tính chiều dài gen',
                  detail: 'Gen gồm 2 mạch đơn:',
                  formula: 'L = (N / 2) * 3.4 = (3000 / 2) * 3.4 = 5100 (Å) = 510 (nm)',
                },
                {
                  title: 'Bước 2: Xác định số nucleotide từng loại',
                  detail:
                    'Theo nguyên tắc bổ sung:\nA = T = 600\nG = X = (N / 2) - A = 1500 - 600 = 900',
                  formula: 'A = 600, G = 900',
                },
                {
                  title: 'Bước 3: Tính số liên kết hydro',
                  detail: 'Áp dụng công thức H = 2A + 3G:',
                  formula: 'H = 2*600 + 3*900 = 1200 + 2700 = 3900 (liên kết)',
                },
              ],
            },
          ],
        },
        {
          id: 'b12_c2',
          title: 'Chương 2: Quy luật di truyền Men-đen & Hoán vị gen',
          description:
            'Quy luật phân ly, phân ly độc lập, liên kết gen, hoán vị gen và tương tác gen.',
          keyFormulas: [
            {
              name: 'Tần số hoán vị gen',
              formula: 'f (%) = (Tổng số cá thể tái tổ hợp / Tổng số cá thể) * 100% (f ≤ 50%)',
            },
            { name: 'Tỉ lệ kiểu gen Men-đen 2 cặp', formula: '(1:2:1)*(1:2:1) = 9 loại kiểu gen' },
          ],
          sampleProblems: [
            {
              id: 'b12_p2',
              title: 'Tính tỉ lệ kiểu hình đời F1 trong phép lai 2 cặp tính trạng',
              prompt:
                'Cho lai phân tích cá thể dị hợp 2 cặp gen AaBb với aabb. Xác định tỉ lệ phân ly kiểu hình ở đời con Fb.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Sơ đồ lai',
                  detail: 'P: AaBb x aabb\nGiao tử P: (1/4 AB : 1/4 Ab : 1/4 aB : 1/4 ab) x ab',
                },
                {
                  title: 'Bước 2: Tỉ lệ phân ly kiểu hình',
                  detail: 'Fb: 1 AaBb : 1 Aabb : 1 aaBb : 1 aabb (1 : 1 : 1 : 1)',
                  formula: 'Tỉ lệ: 1 trội-trội : 1 trội-lặn : 1 lặn-trội : 1 lặn-lặn',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_11',
      gradeLabel: 'Lớp 11',
      chapters: [
        {
          id: 'b11_c1',
          title: 'Chuyển hóa vật chất & năng lượng ở sinh vật',
          description: 'Quang hợp và hô hấp ở thực vật, tiêu hóa, tuần hoàn và hô hấp ở động vật.',
          keyFormulas: [
            {
              name: 'Phương trình quang hợp tổng quát',
              formula: '6 CO2 + 12 H2O → (Ánh sáng, Diệp lục) C6H12O6 + 6 O2 + 6 H2O',
            },
          ],
          sampleProblems: [
            {
              id: 'b11_p1',
              title: 'Ý nghĩa của hệ sắc tố quang hợp',
              prompt: 'Vì sao phần lớn lá cây có màu xanh lục?',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Phổ hấp thụ của diệp lục',
                  detail: 'Diệp lục hấp thụ mạnh ánh sáng vùng đỏ và xanh tím.',
                },
                {
                  title: 'Bước 2: Ánh sáng phản chiếu',
                  detail:
                    'Diệp lục không hấp thụ hoặc hấp thụ rất ít ánh sáng vùng xanh lục, ánh sáng này phản chiếu đến mắt người nên ta thấy lá có màu xanh lục.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'grade_10',
      gradeLabel: 'Lớp 10',
      chapters: [
        {
          id: 'b10_c1',
          title: 'Sinh học tế bào & Vi sinh vật',
          description:
            'Thành phần hóa học của tế bào (Carbohydrate, Lipid, Protein, Axit nucleic) và chu kỳ tế bào (Nguyên phân, Giảm phân).',
          keyFormulas: [
            { name: 'Số tế bào con qua k lần nguyên phân', formula: 'N_con = 2^k * N0' },
          ],
          sampleProblems: [
            {
              id: 'b10_p1',
              title: 'Tính số tế bào con sau quá trình nguyên phân',
              prompt:
                'Có 5 tế bào sinh dưỡng của cùng một loài cùng nguyên phân liên tiếp 4 đợt. Tính số tế bào con tạo thành.',
              difficulty: 'basic',
              solutionSteps: [
                {
                  title: 'Bước 1: Áp dụng công thức nguyên phân',
                  detail: 'N = N0 * 2^k = 5 * 2^4 = 5 * 16 = 80 (tế bào con).',
                  formula: 'N = 80 tế bào con',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      grade: 'university',
      gradeLabel: 'Đại học & Cao cấp',
      chapters: [
        {
          id: 'b_uni_c1',
          title: 'Sinh học phân tử & Công nghệ gen',
          description:
            'Kỹ thuật PCR, giải trình tự gen, công nghệ CRISPR-Cas9 và tin sinh học (Bioinformatics).',
          keyFormulas: [
            { name: 'Số bản sao DNA sau n chu kỳ PCR', formula: 'Số bản sao = N0 * 2^n' },
          ],
          sampleProblems: [
            {
              id: 'b_uni_p1',
              title: 'Tính số lượng bản sao DNA qua chu kỳ phản ứng PCR',
              prompt:
                'Bắt đầu từ 100 phân tử DNA khuôn ban đầu, sau 25 chu kỳ PCR sẽ nhân bản được bao nhiêu phân tử DNA?',
              difficulty: 'intermediate',
              solutionSteps: [
                {
                  title: 'Bước 1: Áp dụng công thức PCR lý tưởng',
                  detail:
                    'Số bản sao = 100 * 2^25 ≈ 100 * 33 554 432 = 3 355 443 200 (khoảng 3.35 tỷ bản sao).',
                  formula: 'N ≈ 3.355 * 10^9 bản sao DNA',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
