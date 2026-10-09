// sinhhsgtebao.ts — Chuyên đề bồi dưỡng HỌC SINH GIỎI môn Sinh học, mảng SINH HỌC TẾ BÀO (lớp 10).
//
// Đánh số chương 91 để tách hẳn khỏi các chương của chương trình chuẩn (c1..c4) mà vẫn
// giữ đúng khuôn id `sinh<lớp>-c<chương>-b<bài>` do BiologyLessonSchema quy định — cùng tiền lệ
// với `lyhsgcohoc.ts` (môn Lí) và `hoa-hsg-*` (môn Hoá).
// Ba bài đi từ dễ lên khó theo đúng ba cấp kì thi thật ở Việt Nam:
//   b1 (hsg-truong)    — bài toán phân bào: chỉ cần đếm đúng NST/cromatit/tâm động từng kì
//                        và nắm ba công thức 2^k, (2^k − 1)·2n, số giao tử.
//   b2 (hsg-tinh)      — thêm công cụ định lượng mới: động học Michaelis–Menten (Vmax, Km)
//                        và cách hai kiểu chất ức chế làm đổi Km/Vmax.
//   b3 (hsg-quoc-gia)  — phối hợp hoá lí và sinh lí: áp suất thẩm thấu Van’t Hoff, thế nước
//                        Ψ = Ψs + Ψp, suy chiều nước và điều kiện co nguyên sinh.
import type { BiologyLesson } from '../lessonTypes.js'

export const SINH_HSG_TE_BAO_LESSONS: BiologyLesson[] = [
  {
    id: 'sinh10-c91-b1',
    grade: '10',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG: Sinh học tế bào',
    lessonNumber: 1,
    title: 'Bài toán phân bào: đếm NST, cromatit, tâm động và tế bào con',
    hook:
      'Trong giờ thực hành ở một trường chuyên tại Huế, Minh soi tiêu bản đầu rễ hành và đếm được một tế bào có 32 nhiễm sắc thể, ' +
      'trong khi sách ghi hành tây có 2n = 16. Minh vội kết luận: "Tế bào này bị đột biến gấp đôi!". Cô giáo chỉ hỏi lại: ' +
      '"Em thấy 32 chiếc đó là NST đơn hay kép, và chúng đang đi về hai cực hay xếp một hàng?". Câu hỏi đó chính là chìa khoá ' +
      'của mọi bài toán phân bào.',
    theory:
      'BA ĐẠI LƯỢNG PHẢI TÁCH BẠCH — nhầm một cái là sai cả bài:\n' +
      '— Số NST: đếm theo số TÂM ĐỘNG, không đếm theo số sợi. Một NST kép (2 cromatit dính nhau ở tâm động) vẫn chỉ là MỘT NST.\n' +
      '— Số cromatit: chỉ tồn tại khi NST ở trạng thái kép; NST đơn có 0 cromatit. Vì vậy số cromatit = 2 × số NST kép.\n' +
      '— Số tâm động: LUÔN bằng số NST (đơn hay kép) — đây là quy tắc rà nhanh nhất cho mọi kì.\n\n' +
      '## Vì sao số NST nhảy lên ở kì sau mà không cần nhân đôi ADN\n' +
      'ADN đã nhân đôi xong từ pha S của kì trung gian, nên từ đó tới kì giữa tế bào có 2n NST KÉP (4n cromatit). ' +
      'Tới kì sau, tâm động tách đôi: mỗi cromatit được "thăng cấp" thành một NST đơn có tâm động riêng. Lượng ADN không đổi, ' +
      'nhưng số tâm động gấp đôi, nên số NST đếm được gấp đôi. Đây chính là chỗ Minh nhầm ở tình huống mở đầu: 32 NST đơn ' +
      'đang tách về hai cực là kì sau nguyên phân bình thường của hành (2n = 16).\n\n' +
      '## Bảng đếm cho một tế bào (loài có bộ NST 2n)\n' +
      '— Pha G1: 2n đơn · 0 cromatit · 2n tâm động.\n' +
      '— Sau pha S, kì đầu, kì giữa nguyên phân: 2n kép · 4n cromatit · 2n tâm động.\n' +
      '— Kì sau nguyên phân: 4n đơn · 0 cromatit · 4n tâm động.\n' +
      '— Kì cuối nguyên phân (mỗi tế bào con): 2n đơn · 0 cromatit · 2n tâm động.\n' +
      '— Kì đầu I, kì giữa I, kì sau I giảm phân: 2n kép · 4n cromatit · 2n tâm động (kì sau I chỉ tách cặp tương đồng, tâm động KHÔNG tách).\n' +
      '— Kì cuối I, kì đầu II, kì giữa II (mỗi tế bào): n kép · 2n cromatit · n tâm động.\n' +
      '— Kì sau II: 2n đơn · 0 cromatit · 2n tâm động. Kì cuối II (mỗi giao tử): n đơn.\n\n' +
      '## Ba công thức cho bài toán số lượng — và lý do của chúng\n' +
      '1. x tế bào nguyên phân k lần liên tiếp tạo x·2^k tế bào con, vì mỗi lần phân bào số tế bào nhân đôi.\n' +
      '2. Số NST môi trường cung cấp cho k lần nguyên phân = x·2n·(2^k − 1). Lý do: cuối cùng có x·2^k·2n NST, trừ đi x·2n NST ' +
      'có sẵn ở các tế bào mẹ ban đầu. Nếu đề hỏi số NST được tạo HOÀN TOÀN từ nguyên liệu mới thì là x·2n·(2^k − 2), vì ' +
      'nhân đôi bán bảo toàn nên mạch cũ của mỗi NST ban đầu nằm trong 2 NST con.\n' +
      '3. Giảm phân: 1 tinh bào bậc I tạo 4 tinh trùng; 1 noãn bào bậc I tạo 1 trứng và 3 thể cực. Mỗi tế bào sinh giao tử chỉ ' +
      'nhân đôi NST một lần nên môi trường cung cấp đúng 2n NST cho nó. Hiệu suất thụ tinh = số giao tử được thụ tinh / tổng số ' +
      'giao tử tham gia; mỗi hợp tử cần đúng 1 tinh trùng và 1 trứng.\n\n' +
      '## Bẫy hay gặp\n' +
      '— Đếm cromatit ở kì sau hoặc kì cuối ra 4n: sai, lúc đó NST đã là đơn nên cromatit bằng 0.\n' +
      '— Thấy n NST kép xếp một hàng lại tưởng kì giữa nguyên phân: kì giữa nguyên phân có 2n NST kép; n kép là kì giữa II.\n' +
      '— Quên trừ tế bào mẹ: (2^k − 1) chứ không phải 2^k.',
    workedExample: {
      problem:
        'Một loài có bộ NST 2n = 8. Năm tế bào sinh dục sơ khai cùng nguyên phân 4 lần liên tiếp; mọi tế bào con đều trở thành ' +
        'tinh bào bậc I và giảm phân bình thường. Tính: (a) số tinh bào bậc I; (b) số NST môi trường cung cấp cho nguyên phân; ' +
        '(c) số NST môi trường cung cấp cho giảm phân; (d) số tinh trùng tạo thành.',
      steps: [
        'Bước 1 — Tìm số tế bào con trước, vì mọi đại lượng sau đều tính từ nó: x·2^k = 5 × 2^4 = 5 × 16 = 80 tế bào, chính là 80 tinh bào bậc I.',
        'Bước 2 — NST cho nguyên phân dùng công thức x·2n·(2^k − 1), vì phải trừ phần NST đã có sẵn trong 5 tế bào mẹ: 5 × 8 × (16 − 1) = 600 NST.',
        'Bước 3 — NST cho giảm phân: mỗi tinh bào bậc I nhân đôi NST đúng một lần trước giảm phân I, nên cần 2n = 8 NST. Vậy 80 × 8 = 640 NST.',
        'Bước 4 — Số tinh trùng: mỗi tinh bào bậc I cho 4 tinh trùng, nên 80 × 4 = 320 tinh trùng.',
        'Bước 5 — Tự kiểm bằng cách tính gộp: toàn bộ quá trình tương đương k + 1 = 5 lần nhân đôi NST, môi trường cung cấp x·2n·(2^(k+1) − 1) = 5 × 8 × 31 = 1240 NST. Đúng bằng 600 + 640, nên hai kết quả (b) và (c) khớp nhau.',
      ],
      answer: '(a) 80 tinh bào bậc I; (b) 600 NST; (c) 640 NST; (d) 320 tinh trùng.',
    },
    checkQuestions: [
      {
        prompt:
          'Lúa có bộ NST 2n = 24. Ở kì giữa của giảm phân II, MỖI tế bào có bao nhiêu cromatit? (Nhập một số nguyên.)',
        answer: { kind: 'numeric', value: 24 },
        explain:
          'Sau giảm phân I, mỗi tế bào chỉ còn n = 12 NST nhưng vẫn ở trạng thái KÉP vì tâm động chưa tách. Mỗi NST kép có 2 cromatit nên 12 × 2 = 24 cromatit. Lỗi hay gặp: trả lời 48 (lấy số của kì giữa nguyên phân) hoặc 12 (đếm NST thay cho cromatit).',
      },
      {
        prompt:
          'Đậu Hà Lan có 2n = 14. Ba tế bào cùng nguyên phân 5 lần liên tiếp. Môi trường nội bào phải cung cấp bao nhiêu NST đơn? (Nhập một số nguyên.)',
        answer: { kind: 'numeric', value: 1302 },
        explain:
          'Dùng x·2n·(2^k − 1) = 3 × 14 × (32 − 1) = 1302. Phải trừ 1 vì NST của 3 tế bào mẹ đã có sẵn, môi trường chỉ bù phần tăng thêm. Lỗi hay gặp: tính 3 × 14 × 32 = 1344, tức là đếm luôn cả NST ban đầu.',
      },
      {
        prompt:
          'Một con đực có 16 tinh bào bậc I giảm phân bình thường. Hiệu suất thụ tinh của tinh trùng là 12,5%. Tạo được bao nhiêu hợp tử? (Nhập một số nguyên.)',
        answer: { kind: 'numeric', value: 8 },
        explain:
          '16 tinh bào bậc I tạo 16 × 4 = 64 tinh trùng; số tinh trùng được thụ tinh là 64 × 12,5% = 8. Mỗi hợp tử cần đúng một tinh trùng nên có 8 hợp tử. Lỗi hay gặp: lấy 16 × 12,5% = 2 vì quên rằng mỗi tinh bào bậc I cho 4 tinh trùng.',
      },
      {
        prompt:
          'Một loài có 2n = 8. Soi tiêu bản thấy một tế bào có 4 NST kép xếp thành một hàng trên mặt phẳng xích đạo. Tế bào đang ở kì nào?',
        choices: [
          { id: 'ki_1', label: 'Kì giữa nguyên phân' },
          { id: 'ki_2', label: 'Kì giữa giảm phân I' },
          { id: 'ki_3', label: 'Kì giữa giảm phân II' },
          { id: 'ki_4', label: 'Kì sau giảm phân II' },
        ],
        answer: { kind: 'choice', correctIds: ['ki_3'] },
        explain:
          'Có n = 4 NST mà vẫn kép thì tế bào đã qua giảm phân I (bộ NST đã giảm một nửa) nhưng tâm động chưa tách, và xếp một hàng là dấu hiệu kì giữa. Kì giữa nguyên phân phải có 2n = 8 NST kép; kì giữa I có 8 NST kép xếp HAI hàng; kì sau II thì NST đã là đơn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc rà nhanh số tâm động ở mọi kì phân bào?',
        dap: 'Số tâm động luôn bằng số NST (đơn hay kép). Số cromatit = 2 × số NST kép; NST đơn có 0 cromatit.',
      },
      {
        hoi: 'Công thức số NST môi trường cung cấp khi x tế bào (2n) nguyên phân k lần?',
        dap: 'x·2n·(2^k − 1). Nếu hỏi NST mới HOÀN TOÀN thì x·2n·(2^k − 2) do nhân đôi bán bảo toàn.',
      },
      {
        hoi: 'Đếm NST, cromatit ở kì giữa II của loài 2n?',
        dap: 'Mỗi tế bào có n NST kép, 2n cromatit, n tâm động — tâm động chưa tách nên NST vẫn kép.',
      },
    ],
    animation: {
      title: 'Kì giữa sang kì sau: tâm động tách, số NST tăng gấp đôi',
      description:
        'Một tế bào của loài có 2n = 4 đang nguyên phân, vẽ dạng hình chữ nhật bo góc với hai trung thể ở hai đầu và một đường ' +
        'nét đứt nối chúng làm thoi phân bào. Lúc đầu là kì giữa: 4 NST kép xếp thành một hàng dọc trên mặt phẳng xích đạo, ' +
        'mỗi NST gồm hai cromatit đặt sát nhau, hai chiếc dài cùng màu là một cặp tương đồng, hai chiếc ngắn màu khác là cặp ' +
        'còn lại. Dòng chữ dưới hình ghi: kì giữa có 4 NST kép, 8 cromatit, 4 tâm động. Sau đó tâm động tách, hai cromatit của ' +
        'mỗi NST rời nhau và trượt về hai cực ngược chiều nhau, mỗi cực nhận đủ một bộ gồm 2 chiếc dài và 2 chiếc ngắn. Dòng chữ ' +
        'thứ hai hiện ra: kì sau có 8 NST đơn, 0 cromatit, 8 tâm động. Thông điệp: số NST tăng gấp đôi chỉ vì tâm động tách, ' +
        'lượng ADN không đổi vì ADN đã nhân đôi từ pha S.',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'lb-tieude',
          x: 230,
          y: 18,
          text: 'Nguyên phân, 2n = 4: đếm lại khi tâm động tách',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'te-bao',
          x: 110,
          y: 30,
          w: 240,
          h: 160,
          rx: 40,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'thoi',
          x1: 128,
          y1: 110,
          x2: 332,
          y2: 110,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '4 3',
        },
        { kind: 'circle', id: 'cuc-trai', cx: 128, cy: 110, r: 5, fill: 'neutral' },
        { kind: 'circle', id: 'cuc-phai', cx: 332, cy: 110, r: 5, fill: 'neutral' },
        {
          kind: 'line',
          id: 'xich-dao',
          x1: 228,
          y1: 54,
          x2: 228,
          y2: 178,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '2 3',
        },
        {
          kind: 'label',
          id: 'lb-xich-dao',
          x: 228,
          y: 48,
          text: 'mặt phẳng xích đạo',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
        },
        // ── Cặp tương đồng thứ nhất (dài): NST 1 và NST 2 ──
        {
          kind: 'rect',
          id: 'c1-trai',
          x: 214,
          y: 58,
          w: 10,
          h: 24,
          rx: 4,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: -58 },
            { atMs: 8000, dx: -58 },
          ],
        },
        {
          kind: 'rect',
          id: 'c1-phai',
          x: 232,
          y: 58,
          w: 10,
          h: 24,
          rx: 4,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: 58 },
            { atMs: 8000, dx: 58 },
          ],
        },
        {
          kind: 'rect',
          id: 'c2-trai',
          x: 214,
          y: 88,
          w: 10,
          h: 24,
          rx: 4,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: -58 },
            { atMs: 8000, dx: -58 },
          ],
        },
        {
          kind: 'rect',
          id: 'c2-phai',
          x: 232,
          y: 88,
          w: 10,
          h: 24,
          rx: 4,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: 58 },
            { atMs: 8000, dx: 58 },
          ],
        },
        // ── Cặp tương đồng thứ hai (ngắn): NST 3 và NST 4 ──
        {
          kind: 'rect',
          id: 'c3-trai',
          x: 214,
          y: 120,
          w: 10,
          h: 16,
          rx: 4,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: -58 },
            { atMs: 8000, dx: -58 },
          ],
        },
        {
          kind: 'rect',
          id: 'c3-phai',
          x: 232,
          y: 120,
          w: 10,
          h: 16,
          rx: 4,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: 58 },
            { atMs: 8000, dx: 58 },
          ],
        },
        {
          kind: 'rect',
          id: 'c4-trai',
          x: 214,
          y: 144,
          w: 10,
          h: 16,
          rx: 4,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: -58 },
            { atMs: 8000, dx: -58 },
          ],
        },
        {
          kind: 'rect',
          id: 'c4-phai',
          x: 232,
          y: 144,
          w: 10,
          h: 16,
          rx: 4,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 4500, dx: 58 },
            { atMs: 8000, dx: 58 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-ki-giua',
          x: 230,
          y: 210,
          text: 'Kì giữa: 4 NST kép · 8 cromatit · 4 tâm động',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-ki-sau',
          x: 230,
          y: 230,
          text: 'Kì sau: 8 NST đơn · 0 cromatit · 8 tâm động',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Kì giữa: 4 NST kép xếp một hàng; mỗi NST gồm 2 cromatit dính nhau ở một tâm động.',
        },
        {
          atMs: 2500,
          text: 'Kì sau: tâm động tách, mỗi cromatit thành một NST đơn và đi về một cực.',
        },
        {
          atMs: 4500,
          text: 'Số NST tăng từ 4 lên 8 mà ADN không nhân đôi thêm: ADN đã nhân đôi từ pha S.',
        },
      ],
    },
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c91-b2',
    grade: '10',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG: Sinh học tế bào',
    lessonNumber: 2,
    title: 'Động học enzyme: Vmax, Km và hai kiểu chất ức chế',
    hook:
      'Nhiều nhà ở miền Tây ướp thịt bò với dứa xay cho mềm: enzyme bromelain trong dứa cắt các chuỗi protein của thịt. ' +
      'Nhưng ướp quá lâu thì thịt bở nhão, còn lấy dứa đã nấu chín ra ướp thì thịt chẳng mềm hơn chút nào. Cùng một quả dứa, ' +
      'vì sao lúc thì enzyme làm việc quá đà, lúc lại "tắt hẳn"? Muốn trả lời bằng con số chứ không chỉ bằng cảm giác, ' +
      'ta cần hai đại lượng: Vmax và Km.',
    theory:
      'BỐN NHÂN TỐ ẢNH HƯỞNG TỚI TỐC ĐỘ PHẢN ỨNG ENZYME — và cơ chế đằng sau:\n' +
      '— Nhiệt độ: tăng nhiệt độ làm phân tử va chạm nhiều hơn nên tốc độ tăng, tới nhiệt độ tối ưu. Vượt quá đó, liên kết yếu ' +
      'giữ cấu hình không gian bị phá, trung tâm hoạt động biến dạng (biến tính) và thường KHÔNG hồi phục khi làm nguội. Ngược lại, ' +
      'ở nhiệt độ thấp enzyme chỉ bị kìm hoạt động, ấm lên thì chạy lại. Đó là lý do dứa nấu chín mất tác dụng làm mềm thịt.\n' +
      '— pH: làm đổi trạng thái tích điện của các gốc axit amin ở trung tâm hoạt động. Mỗi enzyme có pH tối ưu riêng ' +
      '(pepsin ở dạ dày khoảng 2, trypsin ở ruột non khoảng 8).\n' +
      '— Nồng độ enzyme: khi cơ chất dư, tốc độ tỉ lệ thuận với lượng enzyme.\n' +
      '— Nồng độ cơ chất [S]: lúc đầu tăng [S] thì tốc độ tăng gần tuyến tính, sau đó chậm lại rồi tiến tới một trần gọi là Vmax, ' +
      'vì mọi trung tâm hoạt động đều đã bận (enzyme bão hoà cơ chất).\n\n' +
      '## Phương trình Michaelis–Menten\n' +
      'v = Vmax·[S] / (Km + [S])\n' +
      '— Vmax: tốc độ cực đại khi enzyme bão hoà; tỉ lệ với lượng enzyme có mặt.\n' +
      '— Km (hằng số Michaelis): nồng độ cơ chất tại đó v = Vmax/2. Thay [S] = Km vào phương trình sẽ thấy ngay v = Vmax/2.\n' +
      '— Ý nghĩa của Km: Km NHỎ nghĩa là chỉ cần ít cơ chất enzyme đã chạy được nửa tốc độ, tức ái lực của enzyme với cơ chất CAO. ' +
      'Km lớn thì ái lực thấp.\n' +
      '— Hai vùng gần đúng nên nhớ: khi [S] rất nhỏ so với Km thì v ≈ (Vmax/Km)·[S], tốc độ tỉ lệ thuận với [S]; khi [S] rất lớn ' +
      'so với Km thì v ≈ Vmax, thêm cơ chất gần như vô ích.\n\n' +
      '## Hai kiểu chất ức chế — đọc ra từ Km và Vmax\n' +
      '— Ức chế CẠNH TRANH: chất ức chế có cấu trúc giống cơ chất, gắn vào chính trung tâm hoạt động và tranh chỗ với cơ chất. ' +
      'Tăng đủ nhiều [S] thì cơ chất thắng thế, nên Vmax KHÔNG đổi; nhưng cần nhiều cơ chất hơn mới đạt Vmax/2, nên Km biểu kiến TĂNG.\n' +
      '— Ức chế KHÔNG CẠNH TRANH: chất ức chế gắn vào một vị trí khác, làm đổi cấu hình enzyme. Enzyme đã bị gắn thì thêm bao ' +
      'nhiêu cơ chất cũng không làm việc được, giống như bớt hẳn một phần enzyme, nên Vmax GIẢM; phần enzyme còn lại vẫn có ái ' +
      'lực như cũ nên Km KHÔNG đổi.\n' +
      'Phép thử thực nghiệm: thêm thật nhiều cơ chất. Tốc độ hồi phục về Vmax cũ là ức chế cạnh tranh; không hồi phục là ức chế ' +
      'không cạnh tranh.\n\n' +
      '## Bẫy hay gặp\n' +
      '— Nghĩ "Km lớn là enzyme mạnh": ngược lại, Km lớn là ái lực thấp.\n' +
      '— Nói ức chế cạnh tranh làm giảm Vmax: sai, nó chỉ làm tăng Km biểu kiến.\n' +
      '— Cho rằng ở nồng độ cơ chất gấp đôi thì tốc độ cũng gấp đôi: chỉ gần đúng khi [S] rất nhỏ so với Km.\n' +
      '— Nhầm nhiệt độ thấp với nhiệt độ cao: lạnh chỉ kìm, nóng quá mới phá cấu hình.',
    workedExample: {
      problem:
        'Một enzyme có Vmax = 120 µmol/phút và Km = 4 mM. (a) Tính tốc độ phản ứng khi [S] = 2 mM và khi [S] = 12 mM. ' +
        '(b) Thêm một chất ức chế cạnh tranh làm Km biểu kiến tăng lên 12 mM. Tính tốc độ khi [S] = 12 mM, và tìm [S] cần ' +
        'để tốc độ trở lại 90 µmol/phút.',
      steps: [
        'Bước 1 — Chọn công cụ: đề cho Vmax và Km, hỏi v theo [S], nên dùng thẳng v = Vmax·[S] / (Km + [S]).',
        'Bước 2 — [S] = 2 mM: v = 120 × 2 / (4 + 2) = 240 / 6 = 40 µmol/phút. Tự kiểm: [S] nhỏ hơn Km nên v phải nhỏ hơn Vmax/2 = 60, đúng.',
        'Bước 3 — [S] = 12 mM: v = 120 × 12 / (4 + 12) = 1440 / 16 = 90 µmol/phút. Gấp 6 lần cơ chất nhưng tốc độ chỉ tăng 2,25 lần, vì enzyme đã gần bão hoà.',
        'Bước 4 — Có chất ức chế cạnh tranh: Vmax vẫn là 120, chỉ thay Km = 12 mM. Tại [S] = 12 mM: v = 120 × 12 / (12 + 12) = 60 µmol/phút, đúng bằng Vmax/2 vì lúc này [S] bằng Km.',
        'Bước 5 — Tìm [S] để v = 90: 90 = 120·[S] / (12 + [S]) ⇒ 90 × 12 + 90·[S] = 120·[S] ⇒ 1080 = 30·[S] ⇒ [S] = 36 mM.',
        'Bước 6 — Tự kiểm: 120 × 36 / (12 + 36) = 4320 / 48 = 90, đúng. Nhận xét: Km tăng 3 lần thì cũng phải tăng [S] lên 3 lần (12 → 36 mM) để lấy lại cùng tốc độ — đúng tinh thần "cơ chất thắng được chất ức chế cạnh tranh".',
      ],
      answer:
        '(a) 40 µmol/phút và 90 µmol/phút; (b) 60 µmol/phút; cần [S] = 36 mM để trở lại 90 µmol/phút.',
    },
    checkQuestions: [
      {
        prompt:
          'Một enzyme có Vmax = 80 µmol/phút và Km = 5 mM. Tính tốc độ phản ứng (µmol/phút) khi nồng độ cơ chất là 15 mM. (Nhập một số.)',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'v = Vmax·[S] / (Km + [S]) = 80 × 15 / (5 + 15) = 1200 / 20 = 60. Kết quả hợp lý vì [S] = 3·Km nên v phải nằm giữa Vmax/2 = 40 và Vmax = 80. Lỗi hay gặp: viết mẫu số là Km thay vì Km + [S], ra 240 — vượt cả Vmax, vô lý.',
      },
      {
        prompt:
          'Một enzyme có Km = 4 mM. Cần nồng độ cơ chất bao nhiêu mM để tốc độ phản ứng đạt 75% Vmax? (Nhập một số.)',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Đặt v = 0,75·Vmax: 0,75 = [S] / (4 + [S]) ⇒ 3 + 0,75·[S] = [S] ⇒ [S] = 12 mM, tức gấp 3 lần Km. Lỗi hay gặp: nghĩ tốc độ tỉ lệ thuận với [S] nên lấy 4 × 1,5 = 6 mM — chỉ đúng khi [S] rất nhỏ so với Km.',
      },
      {
        prompt:
          'Thêm một chất ức chế vào dịch enzyme rồi đo lại. Thấy Vmax giữ nguyên nhưng Km biểu kiến tăng. Chất ức chế này thuộc kiểu nào và vì sao?',
        choices: [
          {
            id: 'uc_1',
            label:
              'Ức chế cạnh tranh: nó tranh trung tâm hoạt động với cơ chất, nên thêm đủ cơ chất vẫn đạt Vmax cũ nhưng cần nhiều cơ chất hơn',
          },
          {
            id: 'uc_2',
            label:
              'Ức chế không cạnh tranh: nó gắn vào vị trí khác nên làm enzyme mất ái lực với cơ chất',
          },
          { id: 'uc_3', label: 'Chất này làm biến tính enzyme giống như khi đun nóng' },
          { id: 'uc_4', label: 'Chất này làm tăng lượng enzyme có trong dung dịch' },
        ],
        answer: { kind: 'choice', correctIds: ['uc_1'] },
        explain:
          'Vmax không đổi nghĩa là lượng enzyme làm việc được khi bão hoà vẫn như cũ — chất ức chế bị cơ chất đẩy lùi, đó là dấu hiệu ức chế cạnh tranh; Km tăng vì phải cần nhiều cơ chất hơn mới đạt nửa tốc độ. Ức chế không cạnh tranh thì ngược lại: Vmax giảm, Km giữ nguyên. Biến tính làm giảm Vmax, không giữ được Vmax.',
      },
      {
        prompt:
          'Enzyme X có Km = 0,1 mM, enzyme Y có Km = 5 mM, cùng xúc tác một cơ chất và cùng Vmax. Trong tế bào, cơ chất chỉ có khoảng 0,1 mM. Nhận định nào ĐÚNG?',
        choices: [
          { id: 'km_1', label: 'Y chạy nhanh hơn vì Km lớn hơn nghĩa là enzyme mạnh hơn' },
          {
            id: 'km_2',
            label:
              'X chạy nhanh hơn hẳn: X có ái lực cao nên ở 0,1 mM đã đạt Vmax/2, còn Y mới đạt chưa tới 2% Vmax',
          },
          { id: 'km_3', label: 'Hai enzyme chạy như nhau vì có cùng Vmax' },
          { id: 'km_4', label: 'Không so sánh được vì thiếu nhiệt độ' },
        ],
        answer: { kind: 'choice', correctIds: ['km_2'] },
        explain:
          'Với X, [S] = Km nên v = Vmax/2. Với Y, v = Vmax × 0,1 / (5 + 0,1) ≈ 0,02·Vmax. Km nhỏ là ái lực cao, nên ở nồng độ cơ chất thấp enzyme có Km nhỏ thắng thế rõ rệt. Cùng Vmax chỉ nói về lúc bão hoà, không nói về lúc cơ chất ít.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương trình Michaelis–Menten và ý nghĩa của Km?',
        dap: 'v = Vmax·[S] / (Km + [S]). Km là [S] tại đó v = Vmax/2; Km nhỏ nghĩa là ái lực của enzyme với cơ chất cao.',
      },
      {
        hoi: 'Ức chế cạnh tranh và không cạnh tranh làm đổi Km, Vmax thế nào?',
        dap: 'Cạnh tranh: Km biểu kiến tăng, Vmax giữ nguyên (thêm cơ chất thắng được). Không cạnh tranh: Vmax giảm, Km giữ nguyên.',
      },
      {
        hoi: 'Vì sao enzyme bị đun quá nhiệt độ tối ưu thường không hồi phục, còn để lạnh thì có?',
        dap: 'Nhiệt cao phá các liên kết yếu giữ cấu hình, trung tâm hoạt động biến dạng (biến tính). Lạnh chỉ làm phân tử chuyển động chậm, cấu hình còn nguyên.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c91-b3',
    grade: '10',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG: Sinh học tế bào',
    lessonNumber: 3,
    title: 'Thế nước, áp suất thẩm thấu và hiện tượng co nguyên sinh',
    hook:
      'Muối dưa cải ở miền Bắc, người ta rắc muối lên rau rồi nén: chỉ sau vài giờ rau héo rũ và nước chảy ra ngập vại. ' +
      'Nhưng tưới cây bằng nước có pha một chút phân thì cây vẫn hút nước bình thường. Ranh giới giữa "hút được" và "bị rút ' +
      'nước" nằm ở đâu? Học sinh giỏi phải tính được ranh giới đó bằng con số, và biết vì sao chỉ nhìn nồng độ chất tan là chưa đủ.',
    theory:
      'ÁP SUẤT THẨM THẤU — ĐỊNH LUẬT VAN’T HOFF\n' +
      'P = i·C·R·T, với C là nồng độ mol/L, R = 0,082 atm·L/(mol·K), T là nhiệt độ tuyệt đối (K = °C + 273), i là hệ số ' +
      'Van’t Hoff — số tiểu phân mà một phân tử chất tan tạo ra trong dung dịch. Saccarozơ, glucozơ không phân li nên i = 1; ' +
      'NaCl phân li thành Na⁺ và Cl⁻ nên coi gần đúng i = 2. VÌ SAO có i: áp suất thẩm thấu chỉ phụ thuộc SỐ tiểu phân tan, ' +
      'không phụ thuộc chúng là chất gì.\n\n' +
      '## Thế nước Ψ: thước đo đúng cho chiều di chuyển của nước\n' +
      'Ψ = Ψs + Ψp\n' +
      '— Thế nước của nước nguyên chất trong bình hở được quy ước bằng 0.\n' +
      '— Thế chất tan Ψs = −P = −i·C·R·T: luôn ÂM, vì chất tan làm nước kém "tự do" hơn. Càng nhiều chất tan, Ψs càng âm.\n' +
      '— Thế áp suất Ψp: áp suất trương nước do thành tế bào ép ngược lên khối nguyên sinh chất; thường DƯƠNG ở tế bào trương, ' +
      'bằng 0 ở tế bào vừa chớm co nguyên sinh và ở dung dịch trong cốc hở.\n' +
      '— Quy tắc duy nhất phải nhớ: nước đi từ nơi có Ψ CAO (ít âm) sang nơi có Ψ THẤP (âm hơn), và dừng khi hai bên bằng nhau.\n' +
      'Trong bài này mọi đại lượng tính bằng atm cho khớp với R = 0,082; nếu đề dùng MPa thì đổi 1 atm ≈ 0,101 MPa.\n\n' +
      '## Vì sao chỉ so nồng độ chất tan là chưa đủ\n' +
      'Tế bào thực vật có thành xenlulozơ. Khi tế bào hút nước, khối nguyên sinh chất phình ra ép vào thành, thành ép ngược lại ' +
      'tạo Ψp dương, làm Ψ của tế bào tăng lên. Vì vậy một tế bào có nồng độ chất tan cao vẫn có thể có Ψ cao hơn tế bào bên ' +
      'cạnh và để nước chảy sang đó. So áp suất thẩm thấu (chỉ là Ψs) mà bỏ qua Ψp là cái bẫy lớn nhất của chuyên đề này.\n\n' +
      '## Co nguyên sinh và phương pháp co nguyên sinh chớm\n' +
      '— Đặt tế bào vào dung dịch có Ψ thấp hơn Ψ tế bào: nước ra ngoài, Ψp giảm dần. Nếu Ψp về tới 0 mà Ψ tế bào vẫn cao hơn ' +
      'dung dịch, khối nguyên sinh chất tiếp tục mất nước và tách khỏi thành tế bào: đó là co nguyên sinh.\n' +
      '— Nếu cân bằng đạt được khi Ψp còn dương thì tế bào chỉ mất bớt sức trương, KHÔNG co nguyên sinh.\n' +
      '— Lúc chớm co nguyên sinh, Ψp = 0 nên Ψ tế bào = Ψs. Ngâm mô vào một dãy dung dịch có nồng độ tăng dần, tìm dung dịch ' +
      'làm khoảng một nửa số tế bào chớm co nguyên sinh, rồi suy ra Ψs của tế bào bằng thế nước của dung dịch đó. ' +
      'Đây là cách đo Ψs trong phòng thí nghiệm.\n' +
      '— Co nguyên sinh còn sống thì đưa vào nước cất sẽ phản co nguyên sinh; tế bào đã chết thì màng mất tính thấm chọn lọc, không phản co được.\n\n' +
      '## Bẫy hay gặp\n' +
      '— Quên đổi °C sang K: dùng 27 thay cho 300 làm áp suất sai hơn 10 lần.\n' +
      '— Quên i = 2 với NaCl.\n' +
      '— Thấy nước rời tế bào là kết luận ngay "co nguyên sinh": còn phải xét Ψp có về 0 trước khi cân bằng hay không.',
    workedExample: {
      problem:
        'Một tế bào lá có Ψs = −7,5 atm và Ψp = +3,5 atm được thả vào cốc hở đựng dung dịch saccarozơ 0,2 M ở 27°C. ' +
        '(a) Tính thế nước của dung dịch. (b) Nước di chuyển theo chiều nào? (c) Tế bào có bị co nguyên sinh không?',
      steps: [
        'Bước 1 — Đổi nhiệt độ trước, vì R tính theo K: T = 27 + 273 = 300 K. Saccarozơ không phân li nên i = 1.',
        'Bước 2 — Áp suất thẩm thấu của dung dịch: P = 1 × 0,2 × 0,082 × 300 = 4,92 atm. Dung dịch trong cốc hở có Ψp = 0, nên Ψ dung dịch = Ψs = −4,92 atm.',
        'Bước 3 — Thế nước của tế bào phải cộng cả Ψp, không chỉ lấy Ψs: Ψ tế bào = −7,5 + 3,5 = −4 atm.',
        'Bước 4 — So sánh: −4 atm cao hơn −4,92 atm, nên nước đi từ TẾ BÀO ra DUNG DỊCH. Lưu ý: nếu chỉ so áp suất thẩm thấu (7,5 so với 4,92) sẽ kết luận ngược, đó là cái bẫy.',
        'Bước 5 — Xét co nguyên sinh: khi tế bào mất nước, Ψp giảm. Giả sử Ψp về tới 0 thì Ψ tế bào ≈ Ψs ≈ −7,5 atm (còn âm hơn nữa vì dịch bào đặc lại), thấp hơn −4,92 atm. Như vậy cân bằng Ψ tế bào = −4,92 atm phải đạt được TRƯỚC khi Ψp về 0.',
        'Bước 6 — Kết luận và tự kiểm: tế bào mất một ít nước, sức trương giảm nhưng Ψp vẫn còn dương (khoảng 2,6 atm nếu coi Ψs gần như không đổi), nên KHÔNG co nguyên sinh.',
      ],
      answer:
        '(a) Ψ dung dịch = −4,92 atm; (b) nước đi từ tế bào ra dung dịch; (c) không co nguyên sinh, vì cân bằng đạt được khi Ψp còn dương.',
    },
    checkQuestions: [
      {
        prompt:
          'Tính áp suất thẩm thấu (atm) của dung dịch NaCl 0,15 M ở 37°C, coi NaCl phân li hoàn toàn và R = 0,082 atm·L/(mol·K). Làm tròn tới 2 chữ số thập phân.',
        answer: { kind: 'numeric', value: 7.63, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          'NaCl phân li thành 2 ion nên i = 2; T = 37 + 273 = 310 K. P = 2 × 0,15 × 0,082 × 310 = 7,626 ≈ 7,63 atm. Lỗi hay gặp: quên i = 2 (ra 3,81) hoặc dùng 37 thay cho 310 (ra khoảng 0,91).',
      },
      {
        prompt:
          'Ở 27°C, các tế bào biểu bì có Ψs = −7,38 atm bắt đầu chớm co nguyên sinh trong dung dịch saccarozơ nồng độ bao nhiêu mol/L? Dùng R = 0,082 atm·L/(mol·K); nhập một số thập phân, làm tròn tới 2 chữ số.',
        answer: { kind: 'numeric', value: 0.3, tolerance: { mode: 'absolute', eps: 0.01 } },
        explain:
          'Lúc chớm co nguyên sinh Ψp = 0, nên Ψ tế bào = Ψs = −7,38 atm và phải bằng Ψ dung dịch = −C·R·T. Vậy C = 7,38 / (1 × 0,082 × 300) = 7,38 / 24,6 = 0,30 M. Lỗi hay gặp: quên rằng Ψp = 0 ở thời điểm chớm co nên cộng thêm Ψp vào.',
      },
      {
        prompt:
          'Một tế bào có Ψs = −10 atm, Ψp = +4 atm được đặt vào cốc hở chứa dung dịch saccarozơ 0,2 M ở 27°C. Nước di chuyển theo chiều nào?',
        choices: [
          {
            id: 'ch_1',
            label: 'Từ dung dịch vào tế bào, vì Ψ dung dịch (−4,92 atm) cao hơn Ψ tế bào (−6 atm)',
          },
          {
            id: 'ch_2',
            label: 'Từ tế bào ra dung dịch, vì tế bào có Ψp dương đẩy nước ra',
          },
          { id: 'ch_3', label: 'Không di chuyển, vì hai bên đều có thế nước âm' },
          { id: 'ch_4', label: 'Từ tế bào ra dung dịch, vì dung dịch có chất tan' },
        ],
        answer: { kind: 'choice', correctIds: ['ch_1'] },
        explain:
          'Ψ dung dịch = −1 × 0,2 × 0,082 × 300 = −4,92 atm; Ψ tế bào = −10 + 4 = −6 atm. Nước đi từ Ψ cao sang Ψ thấp nên đi VÀO tế bào. Ψp dương chỉ làm Ψ tế bào bớt âm chứ không tự đẩy nước ra; hai bên cùng âm vẫn có chênh lệch nên nước vẫn đi.',
      },
      {
        prompt:
          'Hai tế bào thực vật nằm cạnh nhau. Tế bào A: Ψs = −12 atm, Ψp = +8 atm. Tế bào B: Ψs = −8 atm, Ψp = +2 atm. Nhận định nào ĐÚNG?',
        choices: [
          {
            id: 'ab_1',
            label: 'Nước đi từ B sang A, vì A có áp suất thẩm thấu lớn hơn nên hút nước mạnh hơn',
          },
          {
            id: 'ab_2',
            label: 'Nước đi từ A sang B, vì Ψ của A là −4 atm, cao hơn Ψ của B là −6 atm',
          },
          { id: 'ab_3', label: 'Nước không di chuyển vì cả hai tế bào đều đang trương' },
          { id: 'ab_4', label: 'Nước đi từ A sang B, vì A có Ψs âm hơn' },
        ],
        answer: { kind: 'choice', correctIds: ['ab_2'] },
        explain:
          'Phải so thế nước toàn phần: Ψ(A) = −12 + 8 = −4 atm, Ψ(B) = −8 + 2 = −6 atm. A cao hơn nên nước đi từ A sang B, dù A có nhiều chất tan hơn. Đây là bẫy chỉ so áp suất thẩm thấu mà quên Ψp. Phương án "vì A có Ψs âm hơn" đúng chiều nhưng sai lý do: Ψs âm hơn thì lẽ ra nước phải đi vào A.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức Van’t Hoff và các bẫy khi thay số?',
        dap: 'P = i·C·R·T, R = 0,082 atm·L/(mol·K). Đổi T sang K (°C + 273); chất phân li như NaCl có i = 2, saccarozơ có i = 1.',
      },
      {
        hoi: 'Thế nước Ψ gồm những thành phần nào, nước đi theo chiều nào?',
        dap: 'Ψ = Ψs + Ψp; Ψs = −iCRT luôn âm, Ψp là áp suất trương. Nước đi từ nơi có Ψ cao (ít âm) sang nơi có Ψ thấp (âm hơn).',
      },
      {
        hoi: 'Khi nào tế bào mất nước mà KHÔNG co nguyên sinh?',
        dap: 'Khi cân bằng thế nước với dung dịch đạt được lúc Ψp còn dương. Co nguyên sinh chỉ xảy ra nếu Ψp đã về 0 mà Ψ tế bào vẫn cao hơn dung dịch.',
      },
    ],
    animation: {
      title: 'Nước đi theo chênh lệch thế nước, không theo nồng độ chất tan',
      description:
        'Hình chia làm hai ô cách nhau bởi một màng bán thấm vẽ bằng nét đứt. Ô bên trái là tế bào lá có Ψs = −7,5 atm và ' +
        'Ψp = +3,5 atm, nên thế nước toàn phần là −4 atm. Ô bên phải là dung dịch saccarozơ 0,2 M ở 27°C trong cốc hở, thế nước ' +
        '−4,92 atm. Các chấm nhỏ tượng trưng cho phân tử nước lần lượt rời tế bào, vượt qua màng sang ô dung dịch, vì nước luôn ' +
        'đi từ nơi Ψ cao (ít âm) sang nơi Ψ thấp (âm hơn). Một mũi tên dài bên dưới chỉ chiều tế bào sang dung dịch. Cuối cùng ' +
        'hiện dòng chữ: Ψp giảm dần nhưng còn dương khi hai bên cân bằng, nên tế bào mất bớt nước mà không co nguyên sinh. ' +
        'Điểm cần nhớ: tế bào có áp suất thẩm thấu 7,5 atm, lớn hơn dung dịch, mà vẫn mất nước, vì Ψp làm thế nước của nó cao hơn.',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'lb-tieude',
          x: 230,
          y: 20,
          text: 'Nước đi từ nơi Ψ cao (ít âm) sang nơi Ψ thấp (âm hơn)',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'o-te-bao',
          x: 30,
          y: 40,
          w: 186,
          h: 130,
          rx: 10,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'o-dung-dich',
          x: 244,
          y: 40,
          w: 186,
          h: 130,
          rx: 10,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'mang',
          x1: 230,
          y1: 40,
          x2: 230,
          y2: 170,
          stroke: 'neutral',
          strokeWidth: 2,
          dash: '5 4',
        },
        {
          kind: 'label',
          id: 'lb-te-bao',
          x: 123,
          y: 62,
          text: 'Tế bào lá',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-psi-te-bao',
          x: 123,
          y: 80,
          text: 'Ψ = −7,5 + 3,5 = −4 atm',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-dung-dich',
          x: 337,
          y: 62,
          text: 'Saccarozơ 0,2 M, 27°C',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-psi-dung-dich',
          x: 337,
          y: 80,
          text: 'Ψ = −4,92 atm',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        // ── Phân tử nước: lần lượt rời tế bào, vượt màng sang dung dịch ──
        {
          kind: 'circle',
          id: 'nuoc-1',
          cx: 170,
          cy: 108,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 1000, dx: 0 },
            { atMs: 3000, dx: 120 },
            { atMs: 9000, dx: 120 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-2',
          cx: 150,
          cy: 126,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1800, dx: 0 },
            { atMs: 3800, dx: 130 },
            { atMs: 9000, dx: 130 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-3',
          cx: 176,
          cy: 144,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2600, dx: 0 },
            { atMs: 4600, dx: 110 },
            { atMs: 9000, dx: 110 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-4',
          cx: 140,
          cy: 154,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 3400, dx: 0 },
            { atMs: 5400, dx: 150 },
            { atMs: 9000, dx: 150 },
          ],
        },
        {
          kind: 'arrow',
          id: 'chieu-nuoc',
          x1: 110,
          y1: 188,
          x2: 350,
          y2: 188,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-chieu',
          x: 230,
          y: 208,
          text: 'chiều nước: tế bào → dung dịch',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-ket-luan',
          x: 230,
          y: 230,
          text: 'Ψp giảm nhưng còn dương khi cân bằng: không co nguyên sinh',
          size: 10,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5600, opacity: 0 },
            { atMs: 6200, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Tế bào: Ψ = Ψs + Ψp = −7,5 + 3,5 = −4 atm. Dung dịch trong cốc hở: Ψ = −4,92 atm.',
        },
        {
          atMs: 1000,
          text: '−4 atm cao hơn −4,92 atm nên nước rời tế bào, đi qua màng sang dung dịch.',
        },
        {
          atMs: 5600,
          text: 'Tế bào mất nước làm Ψp giảm; cân bằng đạt được khi Ψp còn dương nên không co nguyên sinh.',
        },
      ],
    },
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
