// lyhsgdaodong.ts — Chuyên đề bồi dưỡng HỌC SINH GIỎI môn Vật lí, mảng DAO ĐỘNG.
//
// Chương 92 (tách khỏi chương trình chuẩn lớp 11 là c1..c4). Ba cấp tăng dần:
//   b1 (hsg-truong)   — ghép lò xo, vẫn là con lắc lò xo quen thuộc, chỉ thêm bước tìm k tương đương.
//   b2 (hsg-tinh)     — con lắc trong trường lực lạ (thang máy, xe, lực điện): kỹ thuật g hiệu dụng.
//   b3 (hsg-quoc-gia) — hệ hai vật: điều kiện không trượt và va chạm trong lúc đang dao động.
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY_HSG_DAO_DONG_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly11-c92-b1',
    grade: '11',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG: Dao động',
    lessonNumber: 1,
    title: 'Ghép lò xo và độ cứng tương đương',
    hook:
      'Đề thi học sinh giỏi cấp trường rất hay treo vật vào HAI lò xo thay vì một. Công thức T = 2π√(m/k) vẫn dùng được ' +
      'nguyên vẹn — chỉ cần thay k bằng độ cứng tương đương của bộ lò xo. Cái khó nằm ở chỗ: nhiều bạn nhớ nhầm công thức ' +
      'ghép, vì nó ngược hẳn với công thức ghép điện trở mà các bạn học sau đó.',
    theory:
      'ĐỘ CỨNG TƯƠNG ĐƯƠNG — suy ra chứ đừng học thuộc:\n' +
      '— GHÉP SONG SONG (hai lò xo cùng nối vật với giá đỡ, cùng bị biến dạng một đoạn Δl như nhau):\n' +
      '  Lực kéo về tổng cộng F = F₁ + F₂ = k₁·Δl + k₂·Δl = (k₁ + k₂)·Δl. So với F = k_td·Δl ta được k_td = k₁ + k₂.\n' +
      '  Nhận xét: ghép song song thì hệ CỨNG HƠN, chu kì GIẢM. Trực giác: hai lò xo cùng gánh nên khó kéo hơn.\n' +
      '— GHÉP NỐI TIẾP (hai lò xo nối đuôi nhau, cùng chịu một lực F, độ giãn cộng lại):\n' +
      '  Δl = Δl₁ + Δl₂ = F/k₁ + F/k₂ = F·(1/k₁ + 1/k₂). So với Δl = F/k_td ta được 1/k_td = 1/k₁ + 1/k₂, ' +
      'tức k_td = k₁·k₂/(k₁ + k₂).\n' +
      '  Nhận xét: ghép nối tiếp thì hệ MỀM HƠN cả lò xo mềm nhất, chu kì TĂNG. Trực giác: nối dài thêm thì dễ kéo giãn hơn.\n' +
      '— MẸO NHỚ AN TOÀN: đừng nhớ công thức, hãy nhớ ĐẠI LƯỢNG NÀO CHUNG. Cùng độ giãn → cộng lực → cộng k. ' +
      'Cùng lực → cộng độ giãn → cộng 1/k.\n\n' +
      '## Hệ quả về chu kì (hay dùng để giải nhanh)\n' +
      '— Cùng một vật m, nếu treo riêng từng lò xo cho chu kì T₁, T₂ thì:\n' +
      '  Ghép nối tiếp: T² = T₁² + T₂².  Ghép song song: 1/T² = 1/T₁² + 1/T₂².\n' +
      '— Cắt một lò xo có độ cứng k, chiều dài tự nhiên l₀ thành đoạn dài l thì đoạn đó có độ cứng k′ = k·l₀/l ' +
      '(độ cứng tỉ lệ NGHỊCH với chiều dài, vì cùng một lực thì đoạn ngắn giãn ít hơn).\n\n' +
      '## Điều kiện áp dụng và giới hạn\n' +
      '— Mọi công thức trên chỉ đúng trong giới hạn đàn hồi (định luật Hooke còn nghiệm đúng) và khi khối lượng lò xo ' +
      'không đáng kể so với vật.\n' +
      '— Với con lắc lò xo THẲNG ĐỨNG, chu kì vẫn là T = 2π√(m/k) và không phụ thuộc g; g chỉ làm vị trí cân bằng ' +
      'dịch xuống một đoạn Δl₀ = m·g/k. Từ đó có công thức rất tiện: T = 2π√(Δl₀/g).',
    workedExample: {
      problem:
        'Một vật m = 1 kg được gắn vào hai lò xo có độ cứng k₁ = 40 N/m và k₂ = 60 N/m. ' +
        'Tính độ cứng tương đương và chu kì dao động của hệ trong hai trường hợp: (a) hai lò xo ghép song song; ' +
        '(b) hai lò xo ghép nối tiếp. Lấy π² ≈ 10.',
      steps: [
        'Trường hợp (a) — song song: hai lò xo cùng bị biến dạng một đoạn như nhau nên lực kéo về cộng lại, k_td = k₁ + k₂ = 40 + 60 = 100 (N/m).',
        'Chu kì trường hợp (a): T = 2π√(m/k_td) = 2π√(1/100) = 2π × 0,1 = 0,2π ≈ 0,63 (s).',
        'Trường hợp (b) — nối tiếp: hai lò xo cùng chịu một lực nên độ giãn cộng lại, 1/k_td = 1/40 + 1/60 = 3/120 + 2/120 = 5/120 = 1/24.',
        'Suy ra k_td = 24 (N/m). Chú ý giá trị này NHỎ HƠN cả lò xo mềm nhất (40 N/m) — đó là dấu hiệu nhận biết mình làm đúng cho ghép nối tiếp.',
        'Chu kì trường hợp (b): T = 2π√(1/24) ≈ 2π × 0,204 ≈ 1,28 (s), dài hơn hẳn trường hợp song song.',
        'Kiểm tra chéo bằng công thức chu kì: treo riêng thì T₁ = 2π√(1/40) ≈ 0,993 s, T₂ = 2π√(1/60) ≈ 0,811 s. Ghép nối tiếp: T² = T₁² + T₂² ≈ 0,987 + 0,658 = 1,645 → T ≈ 1,28 s — khớp với kết quả trên.',
      ],
      answer: '(a) k_td = 100 N/m, T ≈ 0,63 s. (b) k_td = 24 N/m, T ≈ 1,28 s.',
    },
    checkQuestions: [
      {
        prompt:
          'Hai lò xo có độ cứng k₁ = 30 N/m và k₂ = 60 N/m được ghép SONG SONG. Tính độ cứng tương đương (theo N/m).',
        answer: {
          kind: 'numeric',
          value: 90,
          unit: 'N/m',
        },
        explain:
          'Ghép song song thì hai lò xo cùng biến dạng một đoạn, lực kéo về cộng lại: k_td = k₁ + k₂ = 90 N/m. Hệ cứng hơn từng lò xo riêng lẻ nên chu kì ngắn lại.',
      },
      {
        prompt:
          'Vẫn hai lò xo k₁ = 30 N/m và k₂ = 60 N/m nhưng ghép NỐI TIẾP. Tính độ cứng tương đương (theo N/m).',
        answer: {
          kind: 'numeric',
          value: 20,
          unit: 'N/m',
        },
        explain:
          '1/k_td = 1/30 + 1/60 = 3/60 = 1/20 nên k_td = 20 N/m. Dấu hiệu kiểm tra: kết quả phải NHỎ HƠN lò xo mềm nhất (30 N/m) — nối dài thêm lò xo thì hệ mềm đi.',
      },
      {
        // Câu bẫy: áp nhầm công thức ghép điện trở cho lò xo (và ngược lại).
        prompt:
          'Một bạn viết: "Ghép nối tiếp thì cộng độ cứng k_td = k₁ + k₂, giống như ghép nối tiếp điện trở". Sai lầm ở đâu?',
        choices: [
          {
            id: 'khong_sai',
            label: 'Không sai, lò xo và điện trở ghép giống hệt nhau',
          },
          {
            id: 'nguoc_lai',
            label:
              'Sai vì nhớ máy móc theo tên gọi: lò xo nối tiếp cùng chịu một LỰC nên phải cộng độ giãn, tức cộng 1/k — cộng k là quy tắc của ghép SONG SONG',
          },
          {
            id: 'chi_sai_don_vi',
            label: 'Chỉ sai đơn vị, còn công thức thì đúng',
          },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['nguoc_lai'],
        },
        explain:
          'Đừng ghi nhớ theo TÊN GỌI "nối tiếp/song song" mà hãy hỏi: đại lượng nào chung cho cả hai lò xo? ' +
          'Nối tiếp: cùng chịu một lực F, độ giãn cộng lại → 1/k_td = 1/k₁ + 1/k₂ (hệ mềm đi, chu kì tăng). ' +
          'Song song: cùng biến dạng một đoạn Δl, lực cộng lại → k_td = k₁ + k₂ (hệ cứng lên, chu kì giảm). ' +
          'Sở dĩ trông "ngược" với điện trở là vì độ cứng k đóng vai trò giống ĐỘ DẪN điện (1/R) chứ không phải điện trở R: cả hai đều là "đại lượng chung khi vật cùng chịu một hiệu ứng". ' +
          'Cách tự kiểm nhanh trong phòng thi: tính xong hãy so kết quả với từng lò xo riêng lẻ — nối tiếp phải nhỏ hơn cái nhỏ nhất, song song phải lớn hơn cái lớn nhất. Sai quy tắc là lộ ra ngay.',
      },
    ],
    srsCards: [
      {
        hoi: 'Độ cứng tương đương khi ghép song song và nối tiếp hai lò xo?',
        dap: 'Song song: k_td = k₁ + k₂ (cứng hơn). Nối tiếp: 1/k_td = 1/k₁ + 1/k₂ (mềm hơn cả lò xo mềm nhất).',
      },
      {
        hoi: 'Cách nhớ an toàn để khỏi lẫn hai công thức ghép lò xo?',
        dap: 'Hỏi đại lượng nào chung: cùng độ giãn thì cộng lực (cộng k); cùng lực thì cộng độ giãn (cộng 1/k).',
      },
      {
        hoi: 'Chu kì con lắc lò xo thẳng đứng tính theo độ giãn ở vị trí cân bằng?',
        dap: 'T = 2π√(Δl₀/g), với Δl₀ = m·g/k là độ giãn của lò xo khi vật nằm ở vị trí cân bằng.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'ly11-c92-b2',
    grade: '11',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG: Dao động',
    lessonNumber: 2,
    title: 'Con lắc trong trường lực lạ: kỹ thuật gia tốc trọng trường hiệu dụng',
    hook:
      'Một chiếc đồng hồ quả lắc chạy đúng ở Hà Nội sẽ chạy sai khi mang lên đỉnh Fansipan, chạy sai trong thang máy đang ' +
      'khởi động, và chạy sai nếu treo quả lắc bằng vật nhiễm điện đặt giữa hai bản tụ. Cả ba tình huống tưởng như khác nhau ' +
      'lại được giải bằng đúng một kỹ thuật.',
    theory:
      'Ý TƯỞNG CỐT LÕI: con lắc đơn không "biết" lực nào đang kéo nó; nó chỉ cảm nhận TỔNG các lực không đổi đặt lên vật. ' +
      'Gộp tất cả các lực không đổi đó lại thành một lực duy nhất gọi là trọng lực hiệu dụng, rồi dùng nguyên công thức cũ ' +
      'với g thay bằng g hiệu dụng.\n\n' +
      '## Công thức tổng quát\n' +
      '— vectơ P_hd = vectơ P + vectơ F_lạ, với F_lạ là lực quán tính (−m·a₀), lực điện (q·E), lực đẩy Ác-si-mét…\n' +
      '— g_hd = |vectơ P_hd| / m, và chu kì T = 2π√(l / g_hd).\n' +
      '— Vị trí cân bằng mới nằm dọc theo phương của P_hd, không còn thẳng đứng nữa. Con lắc dao động quanh vị trí MỚI đó.\n\n' +
      '## Ba trường hợp thường gặp\n' +
      '1. Lực lạ THẲNG ĐỨNG (thang máy): g_hd = g ± a₀. Dấu cộng khi gia tốc a₀ hướng LÊN, dấu trừ khi a₀ hướng XUỐNG. ' +
      'Chú ý phân biệt CHIỀU GIA TỐC với CHIỀU VẬN TỐC: thang máy đi xuống CHẬM DẦN có gia tốc hướng LÊN, nên g_hd = g + a₀ ' +
      'và chu kì GIẢM — đây là chỗ mất điểm kinh điển.\n' +
      '2. Lực lạ NẰM NGANG (xe tăng tốc, lực điện ngang): g_hd = √(g² + a₀²), luôn LỚN HƠN g nên chu kì luôn GIẢM, ' +
      'bất kể xe tăng tốc sang trái hay sang phải. Dây treo lệch góc α với tan α = a₀/g.\n' +
      '3. Lực lạ XIÊN: gọi β là góc giữa lực lạ và chiều của trọng lực (thẳng đứng hướng xuống), khi đó định lí hàm số cosin cho ' +
      'g_hd = √(g² + (F/m)² + 2·g·(F/m)·cos β). Trường hợp 1 (β = 0 hoặc β = 180°) và trường hợp 2 (β = 90°) chỉ là hai ca riêng của công thức này.\n\n' +
      'GIỚI HẠN ÁP DỤNG — đừng dùng sai chỗ:\n' +
      '— Lực lạ phải KHÔNG ĐỔI cả về hướng lẫn độ lớn trong suốt quá trình dao động. Lực cản của không khí hay lực ma sát ' +
      'đổi chiều theo chuyển động thì không gộp được, bài đó thuộc loại dao động tắt dần.\n' +
      '— Với CON LẮC LÒ XO, kỹ thuật này KHÔNG đổi chu kì: T = 2π√(m/k) vốn không chứa g, nên lực lạ không đổi chỉ làm ' +
      'dời vị trí cân bằng chứ không đụng tới chu kì. Áp g_hd vào công thức con lắc lò xo là một lỗi rất nặng.\n' +
      '— Biên độ góc phải nhỏ (α₀ ≤ 10°) để dao động còn coi được là điều hoà.',
    workedExample: {
      problem:
        'Một con lắc đơn có chiều dài l = 1,2 m được treo trong một thang máy. Lấy g = 10 m/s². ' +
        'Tính chu kì dao động nhỏ của con lắc khi thang máy đi lên nhanh dần đều với gia tốc a₀ = 2 m/s², ' +
        'và cho biết khi thang máy đi XUỐNG chậm dần đều với cùng độ lớn gia tốc thì chu kì thay đổi thế nào.',
      steps: [
        'Xét trong hệ quy chiếu gắn với thang máy (hệ phi quán tính). Vật chịu thêm lực quán tính có độ lớn m·a₀, hướng ngược chiều gia tốc của thang máy.',
        'Thang máy đi LÊN NHANH DẦN → vectơ gia tốc a₀ hướng lên → lực quán tính hướng XUỐNG, cùng chiều trọng lực.',
        'Hai lực cùng phương cùng chiều nên cộng độ lớn: P_hd = m·g + m·a₀, suy ra g_hd = g + a₀ = 10 + 2 = 12 (m/s²).',
        'Chu kì: T = 2π√(l/g_hd) = 2π√(1,2/12) = 2π√0,1 ≈ 2π × 0,3162 ≈ 1,99 (s). So với lúc thang đứng yên, T₀ = 2π√(1,2/10) ≈ 2,18 s, nên chu kì đã ngắn lại — con lắc chạy nhanh hơn.',
        'Trường hợp đi XUỐNG CHẬM DẦN: vận tốc hướng xuống nhưng đang giảm, nên gia tốc hướng NGƯỢC vận tốc, tức hướng LÊN — giống hệt trường hợp trên.',
        'Vậy g_hd vẫn là 12 m/s² và chu kì vẫn ≈ 1,99 s. Kết luận quan trọng: chu kì phụ thuộc vectơ GIA TỐC chứ không phụ thuộc thang máy đang đi lên hay đi xuống.',
      ],
      answer:
        'g_hd = 12 m/s²; T ≈ 1,99 s. Thang đi xuống chậm dần cho cùng kết quả vì gia tốc cũng hướng lên.',
    },
    checkQuestions: [
      {
        prompt:
          'Một con lắc đơn treo trong thang máy đi lên NHANH DẦN đều với gia tốc 2 m/s², nơi có g = 10 m/s². Gia tốc trọng trường hiệu dụng bằng bao nhiêu (theo m/s²)?',
        answer: {
          kind: 'numeric',
          value: 12,
          unit: 'm/s²',
        },
        explain:
          'Gia tốc thang máy hướng lên nên lực quán tính hướng xuống, cùng chiều trọng lực: g_hd = g + a₀ = 12 m/s². Chu kì vì thế ngắn lại so với lúc thang đứng yên.',
      },
      {
        prompt:
          'Con lắc đơn dài l = 1,2 m treo trong thang máy đi lên nhanh dần đều với a₀ = 2 m/s² (g = 10 m/s², g_hd = 12 m/s²). Tính chu kì dao động nhỏ (theo s).',
        answer: {
          kind: 'numeric',
          value: 1.99,
          unit: 's',
          tolerance: { mode: 'relative', pct: 1 },
        },
        explain:
          'T = 2π√(l/g_hd) = 2π√(1,2/12) = 2π√0,1 ≈ 1,99 s. Đối chiếu: lúc thang đứng yên T₀ ≈ 2,18 s, nên đồng hồ quả lắc đặt trong thang máy này sẽ chạy NHANH hơn thực tế.',
      },
      {
        // Câu bẫy: lẫn chiều GIA TỐC với chiều VẬN TỐC — lỗi mất điểm kinh điển của dạng thang máy.
        prompt:
          'Thang máy đang đi XUỐNG và CHẬM DẦN đều với độ lớn gia tốc a₀. Chu kì con lắc đơn treo trong đó thay đổi thế nào so với khi thang đứng yên?',
        choices: [
          { id: 'tang', label: 'Tăng, vì thang đi xuống nên g_hd = g − a₀' },
          { id: 'giam', label: 'Giảm, vì gia tốc hướng lên nên g_hd = g + a₀' },
          {
            id: 'khong_doi',
            label: 'Không đổi, vì chu kì không phụ thuộc chuyển động của thang máy',
          },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['giam'],
        },
        explain:
          'Cái quyết định g_hd là vectơ GIA TỐC, không phải chiều đi của thang máy. Thang đi xuống mà CHẬM DẦN nghĩa là vận tốc hướng xuống đang giảm, nên gia tốc phải hướng NGƯỢC vận tốc, tức hướng LÊN. ' +
          'Lực quán tính khi đó hướng xuống, cộng thêm vào trọng lực: g_hd = g + a₀ > g, và T = 2π√(l/g_hd) giảm. ' +
          'Bốn tình huống chỉ gom về hai nhóm: (đi lên nhanh dần) và (đi xuống chậm dần) đều có a hướng lên → T giảm; (đi lên chậm dần) và (đi xuống nhanh dần) đều có a hướng xuống → T tăng. ' +
          'Trường hợp cực đoan: cáp đứt, thang rơi tự do, a₀ = g nên g_hd = 0 — con lắc không dao động nữa mà lơ lửng, chu kì coi như vô hạn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức chu kì con lắc đơn trong trường lực lạ không đổi?',
        dap: 'T = 2π√(l/g_hd) với vectơ P_hd = vectơ P + vectơ F_lạ và g_hd = |P_hd|/m; vị trí cân bằng nằm dọc theo P_hd.',
      },
      {
        hoi: 'Thang máy đi xuống chậm dần thì gia tốc hướng nào, chu kì tăng hay giảm?',
        dap: 'Gia tốc hướng LÊN (ngược chiều vận tốc đang giảm), nên g_hd = g + a₀ và chu kì GIẢM.',
      },
      {
        hoi: 'Có được dùng g hiệu dụng cho con lắc lò xo không?',
        dap: 'Không. T = 2π√(m/k) không chứa g; lực lạ không đổi chỉ làm dời vị trí cân bằng chứ không đổi chu kì.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'ly11-c92-b3',
    grade: '11',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG: Dao động',
    lessonNumber: 3,
    title: 'Hệ hai vật dao động: điều kiện không trượt và va chạm giữa chừng',
    hook:
      'Đặt một cuốn sách lên tấm ván đang dao động trên lò xo. Biên độ nhỏ thì sách đi theo ván như dính vào nhau; ' +
      'tăng biên độ lên quá một ngưỡng nào đó, sách bắt đầu trượt và văng khỏi ván. Ngưỡng ấy ở đâu, và vì sao lại tồn tại ' +
      'một ngưỡng? Đây là dạng bài xuất hiện đều đặn ở kì thi quốc gia, thường ghép thêm một va chạm ngay giữa lúc dao động.',
    theory:
      '## Phần 1 — điều kiện để hai vật cùng dao động mà không trượt lên nhau\n' +
      '— Khi cả hệ (khối lượng M + m) dao động điều hoà với tần số góc ω = √(k/(M+m)), mọi phần tử của hệ đều có ' +
      'cùng gia tốc a = −ω²·x, đạt độ lớn cực đại a_max = ω²·A ở hai vị trí biên.\n' +
      '— Hãy hỏi: LỰC NÀO gây ra gia tốc đó cho vật m nằm trên? Chỉ có duy nhất lực ma sát nghỉ do vật dưới tác dụng. ' +
      'Vậy lực ma sát nghỉ cần thiết là F_msn = m·ω²·|x|, lớn nhất ở biên: F_max = m·ω²·A.\n' +
      '— Nhưng ma sát nghỉ có trần: F_msn ≤ μ·N = μ·m·g (mặt tiếp xúc nằm ngang). Vượt trần thì vật trên không được ' +
      '"kéo" đủ mạnh nữa và bắt đầu trượt lại phía sau.\n' +
      '— ĐIỀU KIỆN KHÔNG TRƯỢT: m·ω²·A ≤ μ·m·g. Khối lượng m triệt tiêu, còn lại A ≤ μ·g/ω². ' +
      'Diễn giải: vật nặng hay nhẹ không quan trọng; cái quyết định là biên độ, tần số và hệ số ma sát.\n' +
      '— Nơi trượt xảy ra đầu tiên luôn là VỊ TRÍ BIÊN (gia tốc lớn nhất), không phải vị trí cân bằng — nhiều bạn đoán ngược.\n\n' +
      '## Phần 2 — va chạm giữa lúc đang dao động\n' +
      '— Va chạm diễn ra trong thời gian rất ngắn nên trong lúc va chạm ta dùng BẢO TOÀN ĐỘNG LƯỢNG (lực lò xo hữu hạn, ' +
      'không kịp gây xung lượng đáng kể), còn cơ năng thì không bảo toàn nếu va chạm mềm.\n' +
      '— Sau va chạm hệ có khối lượng mới nên tần số góc mới ω′ = √(k/(M+m)); biên độ mới tính từ trạng thái ngay sau ' +
      'va chạm bằng hệ thức độc lập A′² = x′² + v′²/ω′².\n' +
      '— HAI TÌNH HUỐNG cho kết quả trái ngược, cần phân biệt rất rõ:\n' +
      '  • Đặt thêm vật khi hệ đang ở VỊ TRÍ BIÊN (v = 0): động lượng vẫn bằng 0, x′ = A không đổi, nên BIÊN ĐỘ GIỮ NGUYÊN, ' +
      'chỉ có chu kì tăng lên vì khối lượng tăng.\n' +
      '  • Đặt thêm vật khi hệ đang qua VỊ TRÍ CÂN BẰNG (x = 0, v = v_max): bảo toàn động lượng cho v′ = M·v/(M+m) < v, ' +
      'mà x′ = 0, nên A′ = v′/ω′ < A — BIÊN ĐỘ GIẢM. Một phần cơ năng đã mất thành nhiệt trong va chạm mềm.\n\n' +
      'GIỚI HẠN: các kết quả trên giả thiết mặt sàn dưới nhẵn, lò xo nhẹ, va chạm xảy ra tức thời và vật đặt thêm ' +
      'không nảy lên. Nếu có ma sát với sàn thì dao động tắt dần và phải xử lý theo cách khác.',
    workedExample: {
      problem:
        'Một tấm ván M = 1,6 kg gắn vào lò xo k = 100 N/m, đặt trên mặt sàn nằm ngang nhẵn. Trên ván có một vật nhỏ ' +
        'm = 0,4 kg, hệ số ma sát nghỉ cực đại giữa vật và ván là μ = 0,4. Lấy g = 10 m/s². ' +
        'Tìm biên độ dao động lớn nhất của hệ để vật m không bị trượt trên ván.',
      steps: [
        'Khi chưa trượt, cả hai vật dao động như một vật duy nhất có khối lượng M + m = 2 kg, nên tần số góc ω = √(k/(M+m)) = √(100/2) = √50 (rad/s), tức ω² = 50 rad²/s².',
        'Xét riêng vật m: lực duy nhất theo phương ngang tác dụng lên nó là lực ma sát nghỉ do ván tác dụng. Chính lực này phải tạo ra toàn bộ gia tốc của m.',
        'Gia tốc trong dao động điều hoà có độ lớn cực đại ở biên: a_max = ω²·A. Vậy lực ma sát nghỉ cần thiết lớn nhất là F_cần = m·ω²·A.',
        'Ma sát nghỉ không thể lớn hơn giá trị cực đại F_msn(max) = μ·N = μ·m·g (mặt ngang nên N = m·g).',
        'Điều kiện không trượt: m·ω²·A ≤ μ·m·g. Rút gọn m ở hai vế → A ≤ μ·g/ω² = (0,4 × 10)/50 = 0,08 (m) = 8 cm.',
        'Nhận xét quan trọng: khối lượng m đã bị triệt tiêu, nên đặt vật nặng hay nhẹ lên ván cũng cho cùng một biên độ ngưỡng — chỉ cần μ và ω không đổi.',
        'Kiểm tra ý nghĩa: nếu kéo hệ ra 10 cm rồi thả, vật m sẽ trượt, và nơi bắt đầu trượt là hai vị trí biên, vì đó là lúc gia tốc cần thiết lớn nhất.',
      ],
      answer: 'A_max = 0,08 m = 8 cm; vật bắt đầu trượt tại vị trí biên.',
    },
    checkQuestions: [
      {
        prompt:
          'Hệ ván + vật có tần số góc ω² = 50 rad²/s², hệ số ma sát nghỉ cực đại μ = 0,5 giữa vật và ván, g = 10 m/s². Tính biên độ lớn nhất để vật không trượt (theo m).',
        answer: {
          kind: 'numeric',
          value: 0.1,
          unit: 'm',
        },
        explain:
          'A_max = μ·g/ω² = (0,5 × 10)/50 = 0,1 m = 10 cm. Khối lượng vật đặt trên không xuất hiện trong kết quả vì nó bị triệt tiêu giữa lực quán tính cần thiết (m·ω²·A) và ma sát nghỉ cực đại (μ·m·g).',
      },
      {
        prompt:
          'Vật M = 3 kg gắn lò xo đang dao động, khi đi qua vị trí cân bằng với tốc độ 0,4 m/s thì một vật m = 1 kg được đặt nhẹ lên và dính vào nó. Tính tốc độ của hệ ngay sau đó (theo m/s).',
        answer: {
          kind: 'numeric',
          value: 0.3,
          unit: 'm/s',
        },
        explain:
          'Va chạm mềm theo phương ngang, lực lò xo hữu hạn nên trong khoảnh khắc va chạm động lượng ngang bảo toàn: M·v = (M + m)·v′ → v′ = 3 × 0,4/4 = 0,3 m/s. Vì x′ = 0 nên biên độ mới A′ = v′/ω′ nhỏ hơn biên độ cũ — đặt thêm vật ở vị trí cân bằng làm biên độ GIẢM.',
      },
      {
        // Câu bẫy: tưởng đặt thêm vật thì bao giờ biên độ cũng giảm, không phân biệt vị trí đặt.
        prompt:
          'Một vật nhỏ được đặt nhẹ lên vật đang dao động điều hoà đúng lúc vật này ở VỊ TRÍ BIÊN và dính vào nó. So với trước, biên độ và chu kì của hệ thay đổi thế nào?',
        choices: [
          {
            id: 'deu_giam',
            label: 'Biên độ giảm và chu kì giảm, vì hệ nặng hơn nên dao động yếu đi',
          },
          { id: 'bien_giu_chu_ki_tang', label: 'Biên độ giữ nguyên, chu kì tăng' },
          { id: 'bien_giam_chu_ki_tang', label: 'Biên độ giảm, chu kì tăng' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['bien_giu_chu_ki_tang'],
        },
        explain:
          'Phải hỏi trạng thái NGAY SAU khi đặt vật: li độ x′ và vận tốc v′ bằng bao nhiêu? Ở vị trí biên, vận tốc của hệ bằng 0, nên va chạm không làm mất động lượng nào cả: sau khi đặt, hệ vẫn đứng yên tại li độ x′ = A. ' +
          'Mà vật đứng yên ở li độ A thì đó chính là vị trí biên mới, tức A′ = A — biên độ giữ nguyên. ' +
          'Chu kì thì tăng vì T = 2π√((M+m)/k) với khối lượng lớn hơn. ' +
          'Trường hợp đặt vật ở VỊ TRÍ CÂN BẰNG lại cho kết quả khác hẳn: lúc đó v = v_max, bảo toàn động lượng làm vận tốc tụt xuống v′ = M·v/(M+m), nên A′ = v′/ω′ < A, biên độ GIẢM. ' +
          'Bài học: đừng nhớ kết luận, hãy nhớ quy trình — tìm x′ và v′ ngay sau va chạm, rồi ráp vào A′² = x′² + v′²/ω′².',
      },
    ],
    srsCards: [
      {
        hoi: 'Điều kiện để vật đặt trên tấm ván dao động không bị trượt?',
        dap: 'A ≤ μ·g/ω². Trượt bắt đầu ở vị trí biên, nơi gia tốc lớn nhất; điều kiện này không phụ thuộc khối lượng vật đặt trên.',
      },
      {
        hoi: 'Đặt thêm vật ở vị trí biên và ở vị trí cân bằng khác nhau thế nào?',
        dap: 'Ở biên: v = 0 nên biên độ giữ nguyên, chỉ chu kì tăng. Ở vị trí cân bằng: động lượng bảo toàn làm vận tốc giảm nên biên độ giảm.',
      },
      {
        hoi: 'Trong va chạm xảy ra giữa lúc dao động, đại lượng nào được bảo toàn?',
        dap: 'Động lượng (vì va chạm diễn ra tức thời, lực lò xo không kịp gây xung lượng đáng kể). Cơ năng không bảo toàn nếu va chạm mềm.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
