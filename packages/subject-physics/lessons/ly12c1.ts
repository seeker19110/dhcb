// lessons/ly12c1.ts — Vật lí 12, Chương 1: Vật lí nhiệt (7 bài).
import type { PhysicsLesson } from '../lessonTypes.js'
import { donViHienThi } from '@dhcb/core-grading/units'

export const LY12_C1_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly12-c1-b1',
    // Hình động cho thấy ĐIỀU MÀ CÂU VĂN KHÔNG NÓI ĐƯỢC: khác biệt rắn/lỏng/khí nằm ở BIÊN ĐỘ và
    // QUÃNG ĐƯỜNG chuyển động của phân tử, không phải ở "loại hạt" khác nhau.
    animation: {
      title: 'Ba thể của cùng một chất khác nhau ở cách phân tử chuyển động',
      description:
        'Ba khung cạnh nhau chứa CÙNG một số phân tử, chỉ khác cách chúng chuyển động. Khung trái (thể rắn): chín phân tử xếp thành mạng đều đặn, mỗi hạt chỉ rung quanh đúng chỗ của nó — hết chu kì hạt nào vẫn ở ô của hạt đó, nên vật rắn giữ nguyên hình dạng và thể tích. Khung giữa (thể lỏng): các phân tử vẫn chạm nhau, khoảng cách gần như cũ, nhưng chúng trượt lên nhau và đổi chỗ cho nhau — thể tích gần như không đổi mà hình dạng thì chảy theo bình. Khung phải (thể khí): chỉ còn năm phân tử trong cùng khoảng không, chúng bay những quãng dài, va vào nhau rồi bật đi hướng khác — khí không có hình dạng lẫn thể tích riêng. Điều hình động phá bỏ: nóng chảy hay bay hơi KHÔNG làm phân tử biến mất hay đổi thành chất khác, nó chỉ nới lỏng liên kết để phân tử đi lại tự do hơn.',
      viewBoxWidth: 480,
      viewBoxHeight: 200,
      durationMs: 5200,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'khung-0',
          x: 20,
          y: 40,
          w: 130,
          h: 130,
          stroke: 'muted',
          strokeWidth: 2,
          rx: 6,
        },
        {
          kind: 'label',
          id: 'ten-0',
          x: 85,
          y: 190,
          text: 'Thể rắn',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'khung-1',
          x: 175,
          y: 40,
          w: 130,
          h: 130,
          stroke: 'muted',
          strokeWidth: 2,
          rx: 6,
        },
        {
          kind: 'label',
          id: 'ten-1',
          x: 240,
          y: 190,
          text: 'Thể lỏng',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'khung-2',
          x: 330,
          y: 40,
          w: 130,
          h: 130,
          stroke: 'muted',
          strokeWidth: 2,
          rx: 6,
        },
        {
          kind: 'label',
          id: 'ten-2',
          x: 395,
          y: 190,
          text: 'Thể khí',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'ran-0',
          cx: 50,
          cy: 70,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-1',
          cx: 85,
          cy: 70,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-2',
          cx: 120,
          cy: 70,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-3',
          cx: 50,
          cy: 105,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-4',
          cx: 85,
          cy: 105,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-5',
          cx: 120,
          cy: 105,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-6',
          cx: 50,
          cy: 140,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-7',
          cx: 85,
          cy: 140,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ran-8',
          cx: 120,
          cy: 140,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 650,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 1300,
              dx: -4,
              dy: 4,
            },
            {
              atMs: 1950,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 2600,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 3250,
              dx: 4,
              dy: -4,
            },
            {
              atMs: 3900,
              dx: -4,
              dy: -4,
            },
            {
              atMs: 4550,
              dx: 4,
              dy: 4,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-0',
          cx: 205,
          cy: 75,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: 18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: -14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: 10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-1',
          cx: 240,
          cy: 70,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: -18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: 14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: -10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-2',
          cx: 275,
          cy: 80,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: 18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: -14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: 10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-3',
          cx: 205,
          cy: 115,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: -18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: 14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: -10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-4',
          cx: 245,
          cy: 110,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: 18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: -14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: 10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-5',
          cx: 280,
          cy: 120,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: -18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: 14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: -10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-6',
          cx: 225,
          cy: 145,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: 18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: -14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: 10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'long-7',
          cx: 265,
          cy: 144,
          r: 8,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: -18,
              dy: 10,
            },
            {
              atMs: 2600,
              dx: 14,
              dy: -8,
            },
            {
              atMs: 3900,
              dx: -10,
              dy: 14,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'khi-0',
          cx: 360,
          cy: 50,
          r: 8,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1300, dx: 90, dy: 60 },
            { atMs: 2600, dx: 30, dy: 110 },
            { atMs: 3900, dx: -20, dy: 40 },
            { atMs: 5200, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'khi-1',
          cx: 430,
          cy: 160,
          r: 8,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1300, dx: -90, dy: -50 },
            { atMs: 2600, dx: -50, dy: -110 },
            { atMs: 3900, dx: 20, dy: -65 },
            { atMs: 5200, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'khi-2',
          cx: 340,
          cy: 150,
          r: 8,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1300, dx: 70, dy: -100 },
            { atMs: 2600, dx: 110, dy: -20 },
            { atMs: 3900, dx: 30, dy: 10 },
            { atMs: 5200, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'khi-3',
          cx: 450,
          cy: 60,
          r: 8,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1300, dx: -90, dy: 100 },
            { atMs: 2600, dx: -110, dy: 10 },
            { atMs: 3900, dx: -30, dy: -10 },
            { atMs: 5200, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'khi-4',
          cx: 395,
          cy: 160,
          r: 8,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1300, dx: 55, dy: -85 },
            { atMs: 2600, dx: -50, dy: -110 },
            { atMs: 3900, dx: -55, dy: -20 },
            { atMs: 5200, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'mui-ten-nhiet',
          x: 240,
          y: 25,
          text: 'Nhiệt độ tăng →',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Rắn: hạt chỉ dao động quanh vị trí cân bằng cố định.',
        },
        {
          atMs: 1700,
          text: 'Lỏng: hạt vẫn sát nhau nhưng trượt và đổi chỗ được.',
        },
        {
          atMs: 3400,
          text: 'Khí: hạt bay tự do, chỉ gặp nhau khi va chạm.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 1,
    chapterTitle: 'Vật lí nhiệt',
    lessonNumber: 1,
    title: 'Cấu trúc của chất. Sự chuyển thể',
    hook:
      'Tại sao nước đá để ngoài phòng lại tan thành nước lỏng, rồi đun nóng nước lỏng lại biến thành hơi nước? ' +
      'Mọi chất quanh ta đều được cấu tạo từ các hạt chuyển động không ngừng, và trạng thái của chúng phụ thuộc vào nhiệt độ và lực liên kết phân tử.',
    theory:
      'MÔ HÌNH ĐỘNG HỌC PHÂN TỬ VỀ CẤU TRÚC CHẤT:\n' +
      '1. Các chất được cấu tạo từ các hạt riêng biệt gọi là phân tử (hoặc nguyên tử, ion).\n' +
      '2. Các phân tử chuyển động không ngừng, chuyển động này càng nhanh thì nhiệt độ của chất càng cao (chuyển động nhiệt).\n' +
      '3. Giữa các phân tử có các lực tương tác (lực hút và lực đẩy phân tử).\n\n' +
      'BA THỂ CỦA CHẤT (RẮN - LỎNG - KHÍ):\n' +
      '— Thể rắn: Các phân tử ở rất gần nhau, sắp xếp có trật tự, chỉ dao động xung quanh các vị trí cân bằng cố định. Do đó, chất rắn có thể tích và hình dạng xác định.\n' +
      '— Thể lỏng: Lực liên kết yếu hơn ở thể rắn, các phân tử vẫn sát nhau nhưng vị trí cân bằng của chúng luôn thay đổi (các phân tử trượt lên nhau và đổi chỗ cho nhau). Do đó, chất lỏng có thể tích xác định nhưng hình dạng không xác định (phụ thuộc bình chứa).\n' +
      '— Thể khí: Lực tương tác phân tử rất yếu, các phân tử ở xa nhau và chuyển động hỗn loạn không ngừng. Chất khí không có thể tích và hình dạng xác định, luôn chiếm toàn bộ thể tích bình chứa.\n\n' +
      'SỰ CHUYỂN THỂ (PHASE TRANSITIONS):\n' +
      '— Nóng chảy (rắn -> lỏng) & Đông đặc (lỏng -> rắn).\n' +
      '— Hoá hơi (lỏng -> khí; gồm bay hơi ở bề mặt và sôi ở cả trong lòng chất lỏng) & Ngưng tụ (khí -> lỏng).\n' +
      '— Thăng hoa (rắn -> khí) & Ngưng kết (khí -> rắn).',
    workedExample: {
      problem:
        'Dựa vào mô hình động học phân tử, hãy giải thích tại sao chất khí không có hình dạng và thể tích xác định mà luôn chiếm đầy bình chứa.',
      steps: [
        'Nhận xét khoảng cách phân tử ở thể khí: Khoảng cách giữa các phân tử khí rất lớn so với kích thước phân tử.',
        'Nhận xét lực liên kết phân tử: Do khoảng cách lớn nên lực tương tác giữa các phân tử khí rất yếu, hầu như có thể bỏ qua.',
        'Mô tả chuyển động: Các phân tử khí chuyển động hỗn loạn không ngừng về mọi phía, va chạm liên tục vào nhau và vào thành bình.',
        'Kết luận: Do chuyển động hỗn loạn tự do và lực liên kết yếu, các phân tử khí tự do lan toả rộng và chiếm toàn bộ thể tích cũng như hình dạng của bất kì bình chứa nào.',
      ],
      answer:
        'Do lực liên kết phân tử rất yếu và khoảng cách phân tử rất lớn, các phân tử khí chuyển động hỗn loạn không ngừng chiếm đầy bình chứa.',
    },
    checkQuestions: [
      {
        prompt:
          'Thể nào của chất có đặc điểm là các phân tử chỉ dao động xung quanh các vị trí cân bằng cố định xác định?',
        choices: [
          { id: 'st_1', label: 'Thể rắn' },
          { id: 'st_2', label: 'Thể lỏng' },
          { id: 'st_3', label: 'Thể khí' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['st_1'],
        },
        explain:
          'Trong chất rắn, lực tương tác phân tử rất mạnh, giữ cho các phân tử chỉ dao động tại chỗ quanh vị trí cân bằng cố định.',
      },
      {
        prompt: 'Quá trình chuyển từ thể lỏng sang thể khí (hơi) của một chất được gọi là:',
        choices: [
          { id: 'ph_1', label: 'Sự hoá hơi' },
          { id: 'ph_2', label: 'Sự nóng chảy' },
          { id: 'ph_3', label: 'Sự ngưng tụ' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ph_1'],
        },
        explain:
          'Quá trình chuyển đổi từ lỏng sang hơi/khí gọi là sự hoá hơi (gồm bay hơi và sôi).',
      },
    ],
    srsCards: [
      {
        hoi: 'Chuyển động nhiệt của các phân tử liên hệ như thế nào với nhiệt độ của chất?',
        dap: 'Nhiệt độ của chất càng cao thì các phân tử chuyển động hỗn loạn càng nhanh.',
      },
      {
        hoi: 'Sự thăng hoa là quá trình chuyển thể nào?',
        dap: 'Là quá trình chuyển thể trực tiếp từ thể rắn sang thể khí (không qua thể lỏng trung gian).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c1-b2',
    // Vì sao cần hình động: dấu của A và Q là chỗ học sinh sai nhiều nhất — phải NHÌN thấy pit-tông
    // đi lên mới hiểu vì sao công mà khí nhận lại mang dấu âm.
    animation: {
      title: 'Nhiệt vào, công ra: nội năng chỉ nhận phần còn lại',
      description:
        'Một xi lanh đứng có pit-tông trượt được, bên trong nhốt sẵn một lượng khí. Ngọn lửa dưới đáy truyền cho khí Q = +500 J (ba mũi tên nhiệt đi từ dưới lên). Khí nóng lên, nở ra và đẩy pit-tông đi lên một đoạn: mũi tên công đi lên cho biết khí ĐÃ THỰC HIỆN công 200 J lên vật bên ngoài, nghĩa là công mà khí NHẬN vào mang dấu âm, A = −200 J. Cuối cảnh phép tính hiện ra từng dòng: ΔU = A + Q = (−200) + 500 = +300 J. Cái bẫy hình động phá bỏ: nhiều bạn tưởng cứ đun 500 J thì nội năng phải tăng đúng 500 J. Không — một phần nhiệt đã đi ra ngoài dưới dạng công đẩy pit-tông, chỉ 300 J còn lại ở dạng nội năng, tức là làm các phân tử khí chuyển động nhanh hơn.',
      viewBoxWidth: 480,
      viewBoxHeight: 280,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'xilanh',
          x: 200,
          y: 50,
          w: 120,
          h: 150,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'pittong',
          x: 202,
          y: 96,
          w: 116,
          h: 14,
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              dy: 0,
            },
            {
              atMs: 1500,
              dy: 0,
            },
            {
              atMs: 4200,
              dy: -40,
            },
            {
              atMs: 6000,
              dy: -40,
            },
          ],
        },
        {
          kind: 'rect',
          id: 'khi',
          x: 202,
          y: 112,
          w: 116,
          h: 86,
          fill: 'accent',
          opacity: 0.35,
          keyframes: [
            {
              atMs: 0,
              opacity: 0.35,
            },
            {
              atMs: 4200,
              opacity: 0.2,
            },
            {
              atMs: 6000,
              opacity: 0.2,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-khi',
          x: 260,
          y: 165,
          text: 'khí trong xi lanh',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'nhiet-1',
          x1: 260,
          y1: 245,
          x2: 260,
          y2: 210,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 399,
              opacity: 0,
            },
            {
              atMs: 700,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'nhiet-2',
          x1: 225,
          y1: 245,
          x2: 225,
          y2: 210,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 699,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'nhiet-3',
          x1: 295,
          y1: 245,
          x2: 295,
          y2: 210,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 999,
              opacity: 0,
            },
            {
              atMs: 1300,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-q',
          x: 260,
          y: 262,
          text: 'Q = +500 J (khí nhận nhiệt)',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'arrow',
          id: 'cong',
          x1: 340,
          y1: 110,
          x2: 340,
          y2: 65,
          stroke: 'correct',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2199,
              opacity: 0,
            },
            {
              atMs: 2500,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 352,
          y: 84,
          text: "A' = 200 J",
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-a-2',
          x: 352,
          y: 101,
          text: 'khí sinh công',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'pt-1',
          x: 20,
          y: 40,
          text: 'ΔU = A + Q',
          size: 16,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'pt-2',
          x: 20,
          y: 62,
          text: 'ΔU = (−200) + 500',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3399,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'pt-3',
          x: 20,
          y: 84,
          text: 'ΔU = +300 J',
          size: 16,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4599,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'giaithich',
          x: 20,
          y: 110,
          text: 'Nội năng tăng 300 J',
          size: 12,
          anchor: 'start',
          fill: 'muted',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4599,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 400,
          text: 'Đun đáy xi lanh: khí nhận nhiệt Q = +500 J.',
        },
        {
          atMs: 2200,
          text: 'Khí nở, đẩy pit-tông lên — khí sinh công 200 J ra ngoài.',
        },
        {
          atMs: 4600,
          text: 'Phần còn lại thành nội năng: ΔU = 500 − 200 = +300 J.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 1,
    chapterTitle: 'Vật lí nhiệt',
    lessonNumber: 2,
    title: 'Nội năng. Định luật I của nhiệt động lực học',
    hook:
      'Xoa mạnh hai bàn tay vào nhau trong ngày đông lạnh giá giúp tay ấm lên. ' +
      'Dưới góc độ vật lí, ta đã thực hiện công lên tay để làm tăng nội năng và nhiệt độ của chúng.',
    theory:
      'KHÁI NIỆM NỘI NĂNG (INTERNAL ENERGY):\n' +
      '— Nội năng (U) của một hệ là tổng động năng của chuyển động hỗn loạn không ngừng của các phân tử cấu tạo nên hệ và thế năng tương tác giữa chúng.\n' +
      '— Nội năng phụ thuộc vào nhiệt độ (T) và thể tích (V) của hệ: U = f(T, V).\n\n' +
      'CÁC CÁCH LÀM BIẾN ĐỔI NỘI NĂNG:\n' +
      '1. Thực hiện công (Doing work): Có sự chuyển hoá năng lượng từ cơ năng sang nội năng (ví dụ cọ xát, nén khí).\n' +
      '2. Truyền nhiệt (Heat transfer): Không có sự chuyển hoá năng lượng mà chỉ có sự truyền nội năng từ vật này sang vật khác (nhiệt lượng Q).\n\n' +
      'ĐỊNH LUẬT I NHIỆT ĐỘNG LỰC HỌC:\n' +
      '— Phát biểu: Độ biến thiên nội năng của hệ bằng tổng công và nhiệt lượng mà hệ nhận được.\n' +
      '— Công thức: ΔU = A + Q.\n' +
      '— Quy ước dấu:\n' +
      '  — Q > 0: Hệ nhận nhiệt lượng (thu nhiệt); Q < 0: Hệ truyền nhiệt lượng (toả nhiệt).\n' +
      '  — A > 0: Hệ nhận công (bị nén); A < 0: Hệ thực hiện công (sinh công/dãn nở).',
    workedExample: {
      problem:
        'Một lượng khí bị nén trong xi lanh. Người ta thực hiện lên khối khí một công bằng 200 J, ' +
        'đồng thời khối khí toả ra môi trường một nhiệt lượng bằng 150 J. Tính độ biến thiên nội năng ΔU của khối khí.',
      steps: [
        'Xác định dấu của công A: Hệ nhận công từ bên ngoài nên A = +200 J.',
        'Xác định dấu của nhiệt lượng Q: Khí toả nhiệt ra môi trường bên ngoài nên Q = -150 J.',
        'Áp dụng công thức Định luật I nhiệt động lực học: ΔU = A + Q.',
        'Thay số tính toán: ΔU = 200 + (-150) = 50 J.',
        'Kết luận: Nội năng của khối khí tăng thêm 50 J.',
      ],
      answer: 'ΔU = 50 J.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết biểu thức toán học của Định luật I nhiệt động lực học liên hệ giữa độ biến thiên nội năng ΔU, công A và nhiệt lượng Q.',
        choices: [
          { id: 'th_1', label: 'ΔU = A + Q' },
          { id: 'th_2', label: 'ΔU = A - Q' },
          { id: 'th_3', label: 'ΔU = Q - A' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['th_1'],
        },
        explain:
          'Độ biến thiên nội năng bằng tổng công và nhiệt lượng mà hệ nhận được: ΔU = A + Q.',
      },
      {
        prompt:
          'Một chất khí nhận nhiệt lượng 500 J từ bên ngoài để dãn nở sinh công 200 J ra môi trường (hệ thực hiện công). Tính độ biến thiên nội năng của khối khí này.',
        answer: {
          kind: 'numeric',
          value: 300,
          unit: 'J',
        },
        explain: 'Q = +500 J, A = -200 J (hệ sinh công). ΔU = A + Q = -200 + 500 = 300 J.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nội năng của một vật gồm những thành phần năng lượng nào ở cấp độ vi mô?',
        dap: 'Gồm động năng của chuyển động nhiệt phân tử và thế năng tương tác giữa các phân tử đó.',
      },
      {
        hoi: 'Trong công thức ΔU = A + Q, khi nào hệ nhận giá trị Q < 0 và A < 0?',
        dap: 'Q < 0 khi hệ toả nhiệt ra bên ngoài. A < 0 khi hệ dãn nở thực hiện công lên bên ngoài.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c1-b3',
    // Hình động dạy điều mà bảng quy đổi không dạy: hai thang khác nhau ở GỐC chứ không ở độ chia,
    // nên độ CHÊNH nhiệt độ tính bằng °C và bằng K là một con số.
    animation: {
      title: 'Hai thang nhiệt độ là cùng một đường thẳng, chỉ khác gốc',
      description:
        'Đồ thị có trục ngang là nhiệt độ Celsius t (°C) và trục đứng là nhiệt độ Kelvin T (K). Một điểm sáng chạy dọc đường biểu diễn từ trái sang phải, bắt đầu ở chỗ đường cắt trục ngang: đó là −273 °C, ứng với T = 0 K, độ không tuyệt đối — dưới mức đó không có nhiệt độ nào. Khi điểm đi qua t = 0 °C, mốc 273 K sáng lên (nước đá đang tan); đi tiếp tới t = 100 °C thì mốc 373 K sáng lên (nước đang sôi). Đường biểu diễn là một ĐƯỜNG THẲNG có độ dốc bằng 1, nên công thức chỉ là T = t + 273. Điều hình động làm rõ mà câu chữ hay gây nhầm: đổi từ °C sang K là DỜI GỐC chứ không phải nhân chia, vì một độ chia của hai thang dài đúng bằng nhau — do đó một ĐỘ CHÊNH lệch 20 °C cũng chính là chênh 20 K, không cộng thêm 273.',
      viewBoxWidth: 440,
      viewBoxHeight: 250,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 55,
          y1: 210,
          x2: 420,
          y2: 210,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 293,
          y1: 235,
          x2: 293,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 420,
          y: 228,
          text: 't (°C)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 299,
          y: 32,
          text: 'T (K)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'duong-thang',
          points: [
            [81, 210],
            [410, 50],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'chieu-273',
          x1: 81,
          y1: 210,
          x2: 81,
          y2: 220,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-0k',
          x: 81,
          y: 236,
          text: '−273 °C = 0 K',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'diem-chay',
          cx: 81,
          cy: 210,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 600,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 5200,
              dx: 329,
              dy: -160,
            },
            {
              atMs: 6000,
              dx: 329,
              dy: -160,
            },
          ],
        },
        {
          kind: 'label',
          id: 'so-t-0',
          x: 287,
          y: 226,
          text: '0',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'so-T-273',
          x: 287,
          y: 100,
          text: '273',
          size: 11,
          anchor: 'end',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2599, opacity: 0 },
            { atMs: 2900, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-nuocda',
          x: 300,
          y: 124,
          text: 'nước đá tan',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2599, opacity: 0 },
            { atMs: 2900, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'giong-100-ngang',
          x1: 293,
          y1: 69.3,
          x2: 370.7,
          y2: 69.3,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '4 3',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4199, opacity: 0 },
            { atMs: 4500, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'giong-100-dung',
          x1: 370.7,
          y1: 69.3,
          x2: 370.7,
          y2: 210,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '4 3',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4199, opacity: 0 },
            { atMs: 4500, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'so-t-100',
          x: 370.7,
          y: 226,
          text: '100',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4199, opacity: 0 },
            { atMs: 4500, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'so-T-373',
          x: 287,
          y: 66,
          text: '373',
          size: 11,
          anchor: 'end',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4199, opacity: 0 },
            { atMs: 4500, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-soi',
          x: 377,
          y: 86,
          text: 'nước sôi',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4199, opacity: 0 },
            { atMs: 4500, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'congthuc',
          x: 66,
          y: 60,
          text: 'T(K) = t(°C) + 273',
          size: 16,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'dochia',
          x: 66,
          y: 82,
          text: 'Một độ chia của hai thang BẰNG NHAU',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 600,
          text: 'Đường cắt trục tại −273 °C: đó là 0 K, độ không tuyệt đối.',
        },
        {
          atMs: 2600,
          text: 'Nước đá tan: 0 °C ứng với 273 K.',
        },
        {
          atMs: 4200,
          text: 'Nước sôi: 100 °C ứng với 373 K — vẫn cùng một đường thẳng.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 1,
    chapterTitle: 'Vật lí nhiệt',
    lessonNumber: 3,
    title: 'Nhiệt độ. Thang nhiệt độ – nhiệt kế',
    hook:
      'Làm thế nào định nghĩa chính xác trạng thái "nóng" và "lạnh" một cách khoa học? ' +
      'Tại sao thang đo Kelvin bắt đầu từ độ không tuyệt đối -273,15 °C? Hãy cùng khám phá thế giới nhiệt độ.',
    theory:
      'KHÁI NIỆM NHIỆT ĐỘ VÀ CÂN BẰNG NHIỆT:\n' +
      '— Nhiệt độ là đại lượng vật lí đặc trưng cho mức độ nóng lạnh của vật, đo bằng động năng trung bình của chuyển động nhiệt phân tử.\n' +
      '— Trạng thái cân bằng nhiệt: Khi hai vật tiếp xúc nhiệt đạt cùng nhiệt độ, không còn sự truyền nhiệt ròng giữa chúng.\n\n' +
      'CÁC THANG NHIỆT ĐỘ THÔNG DỤNG:\n' +
      '1. Thang Celsius (t, °C): Lấy nhiệt độ nóng chảy của nước đá nguyên chất làm mốc 0 °C, nhiệt độ sôi của nước làm mốc 100 °C (ở áp suất tiêu chuẩn).\n' +
      '2. Thang Kelvin (T, K): Là thang nhiệt độ tuyệt đối trong hệ SI. Độ không tuyệt đối (0 K) là nhiệt độ thấp nhất trên lí thuyết, nơi mọi chuyển động nhiệt phân tử ngừng lại.\n\n' +
      'HỆ THỨC CHUYỂN ĐỔI GIỮA CELSIUS VÀ KELVIN:\n' +
      '— T (K) = t (°C) + 273,15  (Thường làm tròn thành T = t + 273).\n' +
      '— Lưu ý về độ chênh lệch nhiệt độ: Khoảng chia của 1 độ C bằng đúng khoảng chia của 1 Kelvin, tức là: ΔT (K) = Δt (°C).',
    workedExample: {
      problem:
        'Nhiệt độ phòng hiện tại đo được là t = 27 °C. ' +
        'a) Hãy chuyển đổi nhiệt độ này sang thang tuyệt đối Kelvin (T).\n' +
        'b) Nếu nhiệt độ phòng tăng thêm 5 °C thì thang Kelvin tăng thêm bao nhiêu?',
      steps: [
        'Áp dụng công thức chuyển đổi: T = t + 273,15.',
        'Thay số tính toán: T = 27 + 273,15 = 300,15 K.',
        'Theo lí thuyết, độ chênh lệch nhiệt độ ở hai thang đo là bằng nhau (ΔT = Δt).',
        'Vì nhiệt độ tăng thêm Δt = 5 °C nên thang Kelvin cũng tăng thêm đúng ΔT = 5 K.',
      ],
      answer: 'T = 300,15 K; Độ tăng tuyệt đối là 5 K.',
    },
    checkQuestions: [
      {
        prompt:
          'Nhiệt độ tuyệt đối T (K) ở thang Kelvin liên hệ với nhiệt độ t (°C) ở thang Celsius theo công thức chuẩn nào?',
        choices: [
          { id: 'tc_1', label: 'T = t + 273,15' },
          { id: 'tc_2', label: 'T = t - 273,15' },
          { id: 'tc_3', label: 'T = (t + 273,15) * 1,8' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['tc_1'],
        },
        explain: 'T tuyệt đối bằng nhiệt độ Celsius cộng thêm hằng số gốc 273,15: T = t + 273,15.',
      },
      {
        prompt:
          'Chuyển đổi nhiệt độ t = 25 °C sang thang nhiệt độ Kelvin (nhập giá trị chính xác dùng hằng số gốc 273,15).',
        answer: {
          kind: 'numeric',
          value: 298.15,
          unit: 'K',
        },
        explain:
          'Thang Kelvin và thang Celsius có cùng ĐỘ CHIA, chỉ khác gốc, nên đổi một giá trị nhiệt độ chỉ cần cộng 273,15: T = 25 + 273,15 = 298,15 K. Cũng vì cùng độ chia nên một ĐỘ CHÊNH nhiệt độ tính bằng °C hay K đều ra cùng con số — chỗ đó không cộng gì cả.',
      },
    ],
    srsCards: [
      {
        hoi: 'Độ không tuyệt đối (0 K) có giá trị bằng bao nhiêu độ C?',
        dap: '-273,15 °C.',
      },
      {
        hoi: 'Độ biến thiên nhiệt độ 10 °C tương đương với độ biến thiên bao nhiêu Kelvin?',
        dap: 'Tương đương đúng 10 K (vì ΔT = Δt).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c1-b4',
    // Hình động biến c thành ĐỘ DỐC nhìn thấy được: cùng một bếp, c càng lớn đường càng thoải.
    animation: {
      title: 'Cùng một bếp, dầu nóng lên nhanh gấp đôi nước',
      description:
        'Hai chấm cùng xuất phát từ điểm 20 °C ở gốc và cùng chạy sang phải theo thời gian: một chấm là 1 kg nước (c = 4200 J/kg·K), một chấm là 1 kg dầu ăn (c = 2000 J/kg·K), đun bằng cùng một bếp 420 W. Cả hai đường đều là đường thẳng vì mỗi giây bếp cấp đúng 420 J, nhưng đường của dầu DỐC HƠN gấp hơn hai lần: mỗi giây nước chỉ ấm thêm 0,1 °C còn dầu ấm thêm 0,21 °C. Tới mốc 100 giây, đường gióng dựng lên cho thấy dầu đã ở 41 °C trong khi nước mới 30 °C. Kết luận mà hình động ép phải nhìn thấy: nhiệt dung riêng LỚN không có nghĩa là "nóng hơn", nó có nghĩa là chất đó cần nhiều nhiệt hơn cho mỗi độ tăng, nên nó nóng lên CHẬM hơn — và cũng vì thế nước nguội chậm, thích hợp làm chất tải nhiệt.',
      viewBoxWidth: 440,
      viewBoxHeight: 230,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 55,
          y1: 200,
          x2: 420,
          y2: 200,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 60,
          y1: 215,
          x2: 60,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 420,
          y: 218,
          text: 't (s)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 66,
          y: 32,
          text: 'θ (°C)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'moc20',
          x: 54,
          y: 204,
          text: '20',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'moc40',
          x: 54,
          y: 140,
          text: '30',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'moc60',
          x: 54,
          y: 76,
          text: '40',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'duong-dau',
          points: [
            [60, 200],
            [410, 66],
          ],
          stroke: 'accent',
          strokeWidth: 3,
        },
        {
          kind: 'polyline',
          id: 'duong-nuoc',
          points: [
            [60, 200],
            [410, 136],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'cham-dau',
          cx: 60,
          cy: 200,
          r: 6,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 700,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 5300,
              dx: 350,
              dy: -134,
            },
            {
              atMs: 6000,
              dx: 350,
              dy: -134,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'cham-nuoc',
          cx: 60,
          cy: 200,
          r: 6,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 700,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 5300,
              dx: 350,
              dy: -64,
            },
            {
              atMs: 6000,
              dx: 350,
              dy: -64,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-dau',
          x: 300,
          y: 126,
          text: 'dầu ăn · c = 2000',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-nuoc',
          x: 300,
          y: 176,
          text: 'nước · c = 4200',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'dieukien',
          x: 70,
          y: 52,
          text: 'Cùng 1 kg · cùng bếp 420 W · cùng xuất phát 20 °C',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'goc-100',
          x1: 410,
          y1: 200,
          x2: 410,
          y2: 60,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4999,
              opacity: 0,
            },
            {
              atMs: 5300,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'ketluan',
          x: 70,
          y: 74,
          text: 'Sau 100 s: dầu 41 °C, nước mới 30 °C',
          size: 13,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4999,
              opacity: 0,
            },
            {
              atMs: 5300,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 700,
          text: 'Hai chấm cùng xuất phát 20 °C, cùng công suất bếp 420 W.',
        },
        {
          atMs: 2600,
          text: 'Đường của dầu dốc hơn: c nhỏ hơn thì nóng lên nhanh hơn.',
        },
        {
          atMs: 5000,
          text: 'Sau 100 s: dầu 41 °C, nước mới 30 °C — chênh do c chứ không do bếp.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 1,
    chapterTitle: 'Vật lí nhiệt',
    lessonNumber: 4,
    title: 'Nhiệt dung riêng',
    hook:
      'Tại sao bãi cát ngoài bờ biển lại nóng bỏng chân dưới ánh nắng mặt trời, trong khi nước biển sát cạnh bên vẫn mát rượi? ' +
      'Nước có khả năng trữ nhiệt rất lớn, hay nói cách khác là có Nhiệt dung riêng cao vượt trội.',
    theory:
      'ĐỊNH NGHĨA NHIỆT DUNG RIÊNG (SPECIFIC HEAT CAPACITY):\n' +
      '— Nhiệt dung riêng (c) của một chất là nhiệt lượng cần thiết để làm cho 1 kg chất đó tăng thêm 1 K (hoặc 1 °C).\n' +
      '— Công thức tính nhiệt lượng thu vào hay toả ra khi thay đổi nhiệt độ:\n' +
      '  Q = m * c * Δt  = m * c * (t₂ - t₁).\n' +
      '  — Q: Nhiệt lượng thu vào hay toả ra (đơn vị: J).\n' +
      '  — m: Khối lượng chất (đơn vị: kg).\n' +
      '  — c: Nhiệt dung riêng của chất (đơn vị: J/kg.K hoặc J/kg.°C).\n' +
      '  — Δt: Độ biến thiên nhiệt độ (độ C hoặc K).\n' +
      '— Ý nghĩa: Chất có c càng lớn thì cần nhiều nhiệt lượng để thay đổi nhiệt độ (nóng lên chậm và nguội đi chậm). c_nước ≈ 4200 J/kg.K.',
    workedExample: {
      problem:
        'Một khối nhôm có khối lượng m = 2 kg được nung nóng tăng nhiệt độ từ t₁ = 20 °C lên t₂ = 50 °C. ' +
        'Biết nhiệt dung riêng của nhôm là c = 880 J/kg.K. Tính nhiệt lượng Q mà khối nhôm đã hấp thụ.',
      steps: [
        'Xác định các thông số: m = 2 kg, c = 880 J/kg.K.',
        'Tính độ tăng nhiệt độ: Δt = t₂ - t₁ = 50 - 20 = 30 °C (tương đương 30 K).',
        'Áp dụng công thức tính nhiệt lượng: Q = m * c * Δt.',
        'Thay số tính toán: Q = 2 * 880 * 30 = 52800 J = 52,8 kJ.',
      ],
      answer: 'Q = 52800 J (52,8 kJ).',
    },
    checkQuestions: [
      {
        prompt:
          'Công thức tính nhiệt lượng Q thu vào hay toả ra của một vật khối lượng m, nhiệt dung riêng c khi nhiệt độ biến đổi một lượng Δt là gì?',
        choices: [
          { id: 'hc_1', label: 'Q = m * c * Δt' },
          { id: 'hc_2', label: 'Q = m * c / Δt' },
          { id: 'hc_3', label: 'Q = c * Δt / m' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['hc_1'],
        },
        explain:
          'Nhiệt lượng tỉ lệ thuận với khối lượng, nhiệt dung riêng và độ biến thiên nhiệt độ: Q = mcΔt.',
      },
      {
        prompt:
          'Cần cung cấp nhiệt lượng bằng bao nhiêu Joule để đun nóng 0,5 kg nước tăng thêm 10 K? Biết nhiệt dung riêng của nước là 4200 J/kg.K.',
        answer: {
          kind: 'numeric',
          value: 21000,
          unit: 'J',
        },
        explain:
          'Q = m * c * Δt = 0,5 * 4200 * 10 = 21000 J. Δt ở đây là ĐỘ TĂNG nhiệt độ (K hoặc °C đều được vì là hiệu số), khác với việc đổi nhiệt độ tuyệt đối T sang Kelvin.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị đo chuẩn của nhiệt dung riêng trong hệ SI là gì?',
        dap: 'Joule trên kilôgam Kelvin (J/kg.K).',
      },
      {
        hoi: 'Tại sao nước được dùng nhiều làm chất làm mát động cơ ô tô hay lò phản ứng?',
        dap: 'Vì nước có nhiệt dung riêng rất lớn (4200 J/kg.K), giúp hấp thụ lượng nhiệt lớn mà ít bị tăng nhiệt độ quá cao.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c1-b5',
    // Đoạn NẰM NGANG của đồ thị là toàn bộ nội dung bài này — chỉ hình động mới cho thấy nó dài
    // đến mức nào so với hai chặng đun thường.
    animation: {
      title: 'Đoạn nằm ngang: đun mãi mà nhiệt độ không tăng',
      description:
        'Đồ thị nhiệt độ theo thời gian khi đun 1 kg nước đá ở −20 °C bằng bếp 1000 W. Chấm sáng chạy theo ba chặng. Chặng 1 (42 giây): đường đi lên dốc, nước đá ấm dần từ −20 °C tới 0 °C. Chặng 2 (334 giây, dài nhất): đường NẰM NGANG đúng ở mức 0 °C — vẫn đun, bếp vẫn cấp 1000 J mỗi giây, tổng cộng 334 000 J, mà nhiệt kế không nhúc nhích, vì toàn bộ nhiệt đó dùng để phá liên kết trong mạng tinh thể nước đá chứ không làm phân tử chạy nhanh hơn. Chặng 3 (84 giây): khi mẩu đá cuối cùng tan hết, đường lại đi lên, nước lỏng ấm dần lên 20 °C. Cái bẫy hình động phá bỏ: "đang đun thì nhiệt độ phải tăng" là sai — trong suốt quá trình chuyển thể nhiệt độ đứng yên, và đoạn ngang đó chiếm tới gần ba phần tư tổng thời gian đun.',
      viewBoxWidth: 440,
      viewBoxHeight: 240,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 55,
          y1: 215,
          x2: 420,
          y2: 215,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 60,
          y1: 225,
          x2: 60,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 420,
          y: 233,
          text: 't (s)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 66,
          y: 32,
          text: 'θ (°C)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'muc-0',
          x1: 60,
          y1: 147,
          x2: 410,
          y2: 147,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-0',
          x: 54,
          y: 151,
          text: '0',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-tru20',
          x: 54,
          y: 204,
          text: '−20',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'duong',
          points: [
            [60, 200],
            [91, 147],
            [334, 147],
            [395, 93],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'cham',
          cx: 60,
          cy: 200,
          r: 6,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 500,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1100,
              dx: 31,
              dy: -53,
            },
            {
              atMs: 5300,
              dx: 274,
              dy: -53,
            },
            {
              atMs: 6500,
              dx: 335,
              dy: -107,
            },
            {
              atMs: 7000,
              dx: 335,
              dy: -107,
            },
          ],
        },
        {
          kind: 'label',
          id: 'gd1',
          x: 97,
          y: 163,
          text: 'đá ấm lên',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'gd2',
          x: 212,
          y: 118,
          text: 'ĐANG NÓNG CHẢY',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1299,
              opacity: 0,
            },
            {
              atMs: 1600,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'gd2-2',
          x: 212,
          y: 136,
          text: 'nhiệt độ đứng yên ở 0 °C',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1299,
              opacity: 0,
            },
            {
              atMs: 1600,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'gd3',
          x: 360,
          y: 100,
          text: 'nước ấm lên',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5299,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'do-dai',
          x1: 95,
          y1: 173,
          x2: 330,
          y2: 173,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2399,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'so-lieu',
          x: 212,
          y: 192,
          text: '334 000 J cho 1 kg mà nhiệt kế không nhúc nhích',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2399,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lam-gi',
          x: 70,
          y: 60,
          text: 'Nhiệt vào lúc này dùng để PHÁ liên kết mạng tinh thể,',
          size: 12,
          anchor: 'start',
          fill: 'muted',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3399,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lam-gi-2',
          x: 70,
          y: 78,
          text: 'không dùng để làm phân tử chạy nhanh hơn → θ không tăng',
          size: 12,
          anchor: 'start',
          fill: 'muted',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3399,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 500,
          text: 'Chặng 1: nước đá ấm từ −20 °C lên 0 °C, hết 42 giây.',
        },
        {
          atMs: 1300,
          text: 'Chặng 2: tới 0 °C thì đường nằm ngang — đá bắt đầu tan.',
        },
        {
          atMs: 2400,
          text: 'Suốt 334 giây, 334 000 J đi vào mà nhiệt độ vẫn 0 °C.',
        },
        {
          atMs: 5300,
          text: 'Chặng 3: tan hết đá, nước lỏng mới lại ấm lên.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 1,
    chapterTitle: 'Vật lí nhiệt',
    lessonNumber: 5,
    title: 'Nhiệt nóng chảy riêng',
    hook:
      'Khi cục nước đá tan chảy ở 0 °C, nhiệt độ của nó hoàn toàn không tăng thêm dù liên tục nhận nhiệt từ môi trường. ' +
      'Nhiệt lượng này đã đi đâu? Nó được dùng để phá vỡ liên kết giữa các phân tử trong chất rắn, cho chúng chuyển sang thể lỏng.',
    theory:
      'Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn một đơn vị khối lượng chất rắn ở nhiệt độ nóng chảy gọi là Nhiệt nóng chảy riêng.\n\n' +
      'CÔNG THỨC NHIỆT NÓNG CHẢY (LATENT HEAT OF FUSION):\n' +
      '— Q = λ * m.\n' +
      '  — Q: Nhiệt lượng cần cung cấp để chất rắn nóng chảy hoàn toàn (J).\n' +
      '  — λ: Nhiệt nóng chảy riêng của chất rắn (đơn vị: J/kg).\n' +
      '  — m: Khối lượng chất rắn (kg).\n' +
      '— Lưu ý: Trong suốt quá trình nóng chảy (hoặc đông đặc), nhiệt độ của hệ được giữ nguyên không đổi.',
    workedExample: {
      problem:
        'Tính nhiệt lượng Q cần cung cấp để làm nóng chảy hoàn toàn m = 2 kg nước đá ở nhiệt độ 0 °C. ' +
        'Biết nhiệt nóng chảy riêng của nước đá là λ = 3,4 * 10⁵ J/kg.',
      steps: [
        'Xác định các thông số: m = 2 kg, λ = 3,4 * 10⁵ J/kg.',
        'Áp dụng công thức tính nhiệt nóng chảy: Q = λ * m.',
        'Thay số tính toán: Q = 3,4 * 10⁵ * 2 = 6,8 * 10⁵ J = 680 kJ.',
      ],
      answer: 'Q = 6,8 * 10⁵ J.',
    },
    checkQuestions: [
      {
        prompt: 'Đơn vị đo của nhiệt nóng chảy riêng λ trong hệ SI là gì?',
        choices: [
          { id: 'lf_1', label: 'Joule trên kilôgam (J/kg)' },
          { id: 'lf_2', label: 'Joule trên kilôgam Kelvin (J/kg.K)' },
          { id: 'lf_3', label: 'Joule (J)' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['lf_1'],
        },
        explain: 'Nhiệt nóng chảy riêng được tính bằng Q/m nên có đơn vị là J/kg.',
      },
      {
        prompt:
          'Cần cung cấp nhiệt lượng 6 * 10⁵ J để nóng chảy hoàn toàn một khối kim loại ở nhiệt độ nóng chảy của nó. Biết nhiệt nóng chảy riêng của kim loại này là 2 * 10⁵ J/kg. Tính khối lượng của khối kim loại đó.',
        answer: {
          kind: 'numeric',
          value: 3,
          unit: 'kg',
        },
        explain:
          'Q = λ * m  ⇒  m = Q / λ = 6 * 10⁵ / (2 * 10⁵) = 3 kg. Công thức này chỉ dùng khi vật ĐÃ ở đúng nhiệt độ nóng chảy — không cộng thêm nhiệt lượng làm nóng vật trước đó.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nhiệt độ của chất thay đổi như thế nào trong quá trình chuyển trạng thái nóng chảy hay đông đặc?',
        dap: 'Nhiệt độ của chất luôn được giữ không đổi trong suốt quá trình chuyển thể.',
      },
      {
        hoi: 'Ý nghĩa của nhiệt nóng chảy riêng λ = 3,4 * 10⁵ J/kg của nước đá là gì?',
        dap: 'Nghĩa là cần cung cấp 340.000 J nhiệt lượng để làm nóng chảy hoàn toàn 1 kg nước đá ở 0 °C.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c1-b6',
    // Giá trị của hình: đặt hai đoạn NẰM NGANG cạnh nhau trên cùng một trục thời gian, tỉ lệ
    // 2 260 000 / 334 000 ≈ 6,8 trở thành thứ nhìn thấy chứ không phải con số phải tin.
    animation: {
      title: 'Hoá hơi ngốn nhiều nhiệt hơn nóng chảy tới gần 7 lần',
      description:
        'Vẫn 1 kg nước và bếp 1000 W như bài nhiệt nóng chảy, nhưng lần này đun tiếp cho tới khi bay hơi hết, và cả hành trình nằm gọn trên một đồ thị. Chấm sáng đi qua bốn chặng: đá ấm từ −20 °C lên 0 °C (42 s), đoạn nằm ngang thứ nhất ở 0 °C trong khi đá tan (334 s, tốn 334 000 J), nước lỏng ấm từ 0 °C lên 100 °C (420 s), rồi đoạn nằm ngang thứ hai ở 100 °C trong khi nước sôi thành hơi. Hai mũi tên đo bề ngang cho thấy đoạn sôi dài gấp khoảng 6,8 lần đoạn tan: 2 260 000 J so với 334 000 J cho cùng 1 kg. Đó chính là lí do đời thường mà hình động giải thích được: bắc ấm lên bếp thì chỉ vài phút là sôi, nhưng để cạn hết nước trong ấm thì phải mất rất lâu — và cũng vì thế hơi nước ở 100 °C gây bỏng nặng hơn nước sôi ở cùng 100 °C.',
      viewBoxWidth: 440,
      viewBoxHeight: 245,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 55,
          y1: 220,
          x2: 420,
          y2: 220,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 60,
          y1: 230,
          x2: 60,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 420,
          y: 238,
          text: 't (s)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 66,
          y: 32,
          text: 'θ (°C)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'muc-0',
          x1: 60,
          y1: 181,
          x2: 410,
          y2: 181,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'line',
          id: 'muc-100',
          x1: 60,
          y1: 63,
          x2: 410,
          y2: 63,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-0',
          x: 54,
          y: 185,
          text: '0',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-100',
          x: 54,
          y: 67,
          text: '100',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'duong',
          points: [
            [60, 205],
            [65, 181],
            [102, 181],
            [150, 63],
            [405, 63],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'cham',
          cx: 60,
          cy: 205,
          r: 6,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 400,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 500,
              dx: 5,
              dy: -24,
            },
            {
              atMs: 1300,
              dx: 42,
              dy: -24,
            },
            {
              atMs: 2400,
              dx: 90,
              dy: -142,
            },
            {
              atMs: 7400,
              dx: 345,
              dy: -142,
            },
            {
              atMs: 8000,
              dx: 345,
              dy: -142,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ngang-tan',
          x1: 66,
          y1: 196,
          x2: 101,
          y2: 196,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 899,
              opacity: 0,
            },
            {
              atMs: 1200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-tan',
          x: 150,
          y: 205,
          text: 'nóng chảy: 334 000 J',
          size: 12,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 899,
              opacity: 0,
            },
            {
              atMs: 1200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ngang-soi',
          x1: 151,
          y1: 48,
          x2: 404,
          y2: 48,
          stroke: 'accent',
          strokeWidth: 3,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2599,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-soi',
          x: 278,
          y: 40,
          text: 'hoá hơi: 2 260 000 J — dài gấp 6,8 lần',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2599,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'gd-nuoc',
          x: 140,
          y: 146,
          text: 'nước lỏng ấm lên',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1499,
              opacity: 0,
            },
            {
              atMs: 1800,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'ketluan',
          x: 165,
          y: 95,
          text: 'Đun sôi thì nhanh, đun CẠN thì rất lâu',
          size: 13,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4999,
              opacity: 0,
            },
            {
              atMs: 5300,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'dieukien',
          x: 165,
          y: 112,
          text: '1 kg nước đá −20 °C · bếp 1000 W',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 400,
          text: 'Đá ấm lên rồi tan ở 0 °C: đoạn ngang thứ nhất.',
        },
        {
          atMs: 1500,
          text: 'Tan hết, nước lỏng ấm dần từ 0 °C tới 100 °C.',
        },
        {
          atMs: 2600,
          text: 'Tới 100 °C: đoạn ngang thứ hai, nước đang hoá hơi.',
        },
        {
          atMs: 5000,
          text: 'Đoạn sôi dài gấp 6,8 lần đoạn tan — đun cạn lâu hơn đun sôi rất nhiều.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 1,
    chapterTitle: 'Vật lí nhiệt',
    lessonNumber: 6,
    title: 'Nhiệt hoá hơi riêng',
    hook:
      'Mồ hôi bay hơi khỏi da giúp cơ thể chúng ta hạ nhiệt mát mẻ trong những ngày nóng. ' +
      'Sự chuyển thể từ lỏng sang hơi cần hấp thụ một lượng năng lượng lớn để giải phóng các phân tử lỏng thoát ra ngoài.',
    theory:
      'Nhiệt lượng cần cung cấp để hoá hơi hoàn toàn một đơn vị khối lượng chất lỏng ở nhiệt độ sôi gọi là Nhiệt hoá hơi riêng.\n\n' +
      'CÔNG THỨC NHIỆT HOÁ HƠI (LATENT HEAT OF VAPORIZATION):\n' +
      '— Q = L * m.\n' +
      '  — Q: Nhiệt lượng cần cung cấp để chất lỏng hoá hơi hoàn toàn ở nhiệt độ sôi (J).\n' +
      '  — L: Nhiệt hoá hơi riêng của chất lỏng (đơn vị: J/kg).\n' +
      '  — m: Khối lượng chất lỏng (kg).\n' +
      '— Lưu ý: Trong suốt quá trình sôi và hoá hơi, nhiệt độ của chất lỏng giữ nguyên ở nhiệt độ sôi.',
    workedExample: {
      problem:
        'Tính nhiệt lượng Q cần cung cấp để hoá hơi hoàn toàn m = 0,5 kg nước lỏng ở nhiệt độ sôi 100 °C. ' +
        'Biết nhiệt hoá hơi riêng của nước là L = 2,26 * 10⁶ J/kg.',
      steps: [
        'Xác định các thông số: m = 0,5 kg, L = 2,26 * 10⁶ J/kg.',
        'Áp dụng công thức tính nhiệt hoá hơi: Q = L * m.',
        'Thay số tính toán: Q = 2,26 * 10⁶ * 0,5 = 1,13 * 10⁶ J = 1130 kJ.',
      ],
      answer: 'Q = 1,13 * 10⁶ J.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính nhiệt lượng Q cần thiết để hoá hơi hoàn toàn khối lượng m chất lỏng ở nhiệt độ sôi với nhiệt hoá hơi riêng L.',
        choices: [
          { id: 'vp_1', label: 'Q = L * m' },
          { id: 'vp_2', label: 'Q = L / m' },
          { id: 'vp_3', label: 'Q = m / L' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['vp_1'],
        },
        explain: 'Nhiệt lượng cần cung cấp tỉ lệ thuận với khối lượng cần hoá hơi: Q = Lm.',
      },
      {
        prompt:
          'Cung cấp nhiệt lượng 4 * 10⁶ J làm hoá hơi hoàn toàn 2 kg một chất lỏng ở nhiệt độ sôi của nó. Tính nhiệt hoá hơi riêng L của chất lỏng này.',
        answer: {
          kind: 'numeric',
          value: 2e6,
          unit: 'J/kg',
        },
        explain:
          'Nhiệt hoá hơi riêng là nhiệt lượng cần để hoá hơi MỘT KILÔGAM chất ở nhiệt độ sôi: L = Q / m = 4 * 10⁶ / 2 = 2 * 10⁶ J/kg. Suốt quá trình hoá hơi nhiệt độ KHÔNG tăng — toàn bộ nhiệt dùng để phá liên kết giữa các phân tử.',
      },
    ],
    srsCards: [
      {
        hoi: 'Sự hoá hơi gồm những hình thức nào?',
        dap: 'Gồm sự bay hơi (xảy ra ở mọi nhiệt độ, chỉ trên bề mặt chất lỏng) và sự sôi (xảy ra ở nhiệt độ sôi, trong toàn bộ lòng chất lỏng).',
      },
      {
        hoi: 'Đơn vị đo của nhiệt hoá hơi riêng L trong hệ SI là gì?',
        dap: 'Joule trên kilôgam (J/kg).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c1-b7',
    // Bài tập này được vẽ vì nó CÓ biến thiên thật: hai đường nhiệt độ hội tụ, và chỗ chúng gặp
    // nhau chính là nghiệm của phương trình cân bằng nhiệt.
    animation: {
      title: 'Trộn nước nóng với nước lạnh: hai đường gặp nhau ở đâu',
      description:
        'Trộn 0,5 kg nước ở 80 °C với 0,5 kg nước ở 20 °C trong bình cách nhiệt. Hai chấm cùng chạy theo thời gian: chấm trên (nước nóng) đi xuống, chấm dưới (nước lạnh) đi lên, và cả hai cùng tiến về một đường ngang duy nhất rồi dừng lại ở đó. Lúc đầu hai đường thay đổi rất nhanh, về sau chậm dần vì chênh lệch nhiệt độ giảm. Điểm gặp nhau nằm đúng ở 50 °C, chính giữa 20 và 80, vì hai khối nước có cùng khối lượng và cùng nhiệt dung riêng: phương trình cân bằng nhiệt 0,5·4200·(80 − θ) = 0,5·4200·(θ − 20) cho θ = 50 °C. Điều hình động dạy thêm: nếu hai khối lượng khác nhau thì đường gặp nhau vẫn có, nhưng LỆCH về phía khối lượng lớn hơn — nhiệt độ cân bằng không phải lúc nào cũng là trung bình cộng.',
      viewBoxWidth: 440,
      viewBoxHeight: 230,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 62,
          y1: 200,
          x2: 425,
          y2: 200,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 70,
          y1: 212,
          x2: 70,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 425,
          y: 218,
          text: 't (phút)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 76,
          y: 32,
          text: 'θ (°C)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'muc-cb',
          x1: 70,
          y1: 112,
          x2: 415,
          y2: 112,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
        },
        {
          kind: 'label',
          id: 'nhan-cb',
          x: 64,
          y: 116,
          text: '50',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-80',
          x: 64,
          y: 50,
          text: '80',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-20',
          x: 64,
          y: 182,
          text: '20',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'duong-nong',
          points: [
            [70, 46],
            [87, 59],
            [104, 70],
            [121, 79],
            [138, 85],
            [155, 91],
            [172, 95],
            [206, 101],
            [240, 105],
            [274, 108],
            [308, 109],
            [342, 110],
            [376, 111],
            [410, 111],
          ],
          stroke: 'danger',
          strokeWidth: 3,
        },
        {
          kind: 'polyline',
          id: 'duong-lanh',
          points: [
            [70, 178],
            [87, 165],
            [104, 154],
            [121, 145],
            [138, 139],
            [155, 133],
            [172, 129],
            [206, 123],
            [240, 119],
            [274, 116],
            [308, 115],
            [342, 114],
            [376, 113],
            [410, 113],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'cham-nong',
          cx: 70,
          cy: 46,
          r: 6,
          fill: 'danger',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 500, dx: 0.0, dy: 0.0 },
            { atMs: 745, dx: 17.0, dy: 13.0 },
            { atMs: 990, dx: 34.0, dy: 24.0 },
            { atMs: 1235, dx: 51.0, dy: 33.0 },
            { atMs: 1480, dx: 68.0, dy: 39.0 },
            { atMs: 1725, dx: 85.0, dy: 45.0 },
            { atMs: 1970, dx: 102.0, dy: 49.0 },
            { atMs: 2460, dx: 136.0, dy: 55.0 },
            { atMs: 2950, dx: 170.0, dy: 59.0 },
            { atMs: 3440, dx: 204.0, dy: 62.0 },
            { atMs: 3930, dx: 238.0, dy: 63.0 },
            { atMs: 4420, dx: 272.0, dy: 64.0 },
            { atMs: 4910, dx: 306.0, dy: 65.0 },
            { atMs: 5400, dx: 340.0, dy: 65.0 },
            { atMs: 6000, dx: 340, dy: 65.0 },
          ],
        },
        {
          kind: 'circle',
          id: 'cham-lanh',
          cx: 70,
          cy: 178,
          r: 6,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 500, dx: 0.0, dy: 0.0 },
            { atMs: 745, dx: 17.0, dy: -13.0 },
            { atMs: 990, dx: 34.0, dy: -24.0 },
            { atMs: 1235, dx: 51.0, dy: -33.0 },
            { atMs: 1480, dx: 68.0, dy: -39.0 },
            { atMs: 1725, dx: 85.0, dy: -45.0 },
            { atMs: 1970, dx: 102.0, dy: -49.0 },
            { atMs: 2460, dx: 136.0, dy: -55.0 },
            { atMs: 2950, dx: 170.0, dy: -59.0 },
            { atMs: 3440, dx: 204.0, dy: -62.0 },
            { atMs: 3930, dx: 238.0, dy: -63.0 },
            { atMs: 4420, dx: 272.0, dy: -64.0 },
            { atMs: 4910, dx: 306.0, dy: -65.0 },
            { atMs: 5400, dx: 340.0, dy: -65.0 },
            { atMs: 6000, dx: 340, dy: -65.0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-nuoc-nong',
          x: 110,
          y: 48,
          text: '0,5 kg nước 80 °C',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-nuoc-lanh',
          x: 100,
          y: 196,
          text: '0,5 kg nước 20 °C',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'pt-1',
          x: 300,
          y: 146,
          text: 'Nhiệt lượng toả ra = nhiệt lượng thu vào',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2199,
              opacity: 0,
            },
            {
              atMs: 2500,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'pt-2',
          x: 300,
          y: 166,
          text: '0,5·4200·(80 − θ) = 0,5·4200·(θ − 20)',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3199,
              opacity: 0,
            },
            {
              atMs: 3500,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'pt-3',
          x: 300,
          y: 188,
          text: '→ θ = 50 °C',
          size: 15,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4399,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 500,
          text: 'Nước nóng nguội đi, nước lạnh ấm lên — cùng một lúc.',
        },
        {
          atMs: 2200,
          text: 'Nhiệt lượng khối nóng toả ra đúng bằng nhiệt lượng khối lạnh thu vào.',
        },
        {
          atMs: 4400,
          text: 'Hai đường gặp nhau tại θ = 50 °C rồi cùng nằm ngang.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 1,
    chapterTitle: 'Vật lí nhiệt',
    lessonNumber: 7,
    title: 'Bài tập về vật lí nhiệt',
    hook:
      'Luyện tập giải các bài toán trao đổi nhiệt phức tạp như pha trộn nước, đá tan chảy ' +
      'hay tính toán hiệu suất đun nấu sẽ giúp bạn củng cố sâu sắc kiến thức nhiệt học.',
    theory:
      'PHƯƠNG TRÌNH CÂN BẰNG NHIỆT (HEAT EQUILIBRIUM):\n' +
      '— Khi không có thất thoát nhiệt ra môi trường ngoài: Q_toả = Q_thu.\n' +
      '  — Vật toả nhiệt (nhiệt độ cao giảm xuống t_cânbằng): Q_toả = m * c * (t_đầu - t_cânbằng).\n' +
      '  — Vật thu nhiệt (nhiệt độ thấp tăng lên t_cânbằng): Q_thu = m * c * (t_cânbằng - t_đầu) + Q_chuyểnthể (nếu có chuyển thể đá tan/nước sôi).\n\n' +
      'HIỆU SUẤT ĐUN NẤU (HEATING EFFICIENCY):\n' +
      '— H = (Q_ích / Q_toànphần) * 100%.\n' +
      '  — Q_ích: Nhiệt lượng làm nóng nước/vật cần nấu đun.\n' +
      '  — Q_toànphần: Nhiệt năng do nhiên liệu toả ra hoặc điện năng tiêu thụ.',
    workedExample: {
      problem:
        'Người ta trộn m₁ = 1 kg nước ở t₁ = 80 °C với m₂ = 1 kg nước ở t₂ = 20 °C trong một nhiệt lượng kế cách nhiệt tốt. ' +
        'Tính nhiệt độ cân bằng θ của hỗn hợp nước khi ổn định (bỏ qua nhiệt lượng hấp thụ bởi nhiệt lượng kế).',
      steps: [
        'Khối nước nóng m₁ = 1 kg hạ nhiệt độ từ 80 °C xuống θ: Q_toả = m₁ * c * (80 - θ).',
        'Khối nước lạnh m₂ = 1 kg tăng nhiệt độ từ 20 °C lên θ: Q_thu = m₂ * c * (θ - 20).',
        'Áp dụng phương trình cân bằng nhiệt: Q_toả = Q_thu.',
        'Thay biểu thức: m₁ * c * (80 - θ) = m₂ * c * (θ - 20). Triệt tiêu c ở cả hai vế.',
        'Vì m₁ = m₂ = 1 kg nên phương trình trở thành: 80 - θ = θ - 20 ⇔ 2θ = 100 ⇔ θ = 50 °C.',
      ],
      answer: 'θ = 50 °C.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong một hệ kín cách nhiệt tốt với bên ngoài, tổng nhiệt lượng do các vật toả ra luôn như thế nào so với tổng nhiệt lượng các vật khác thu vào?',
        choices: [
          { id: 'eq_1', label: 'Bằng nhau' },
          { id: 'eq_2', label: 'Toả ra luôn lớn hơn' },
          { id: 'eq_3', label: 'Thu vào luôn lớn hơn' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['eq_1'],
        },
        explain:
          'Theo định luật bảo toàn năng lượng, tổng nhiệt lượng toả ra bằng đúng tổng nhiệt lượng thu vào: Q_toả = Q_thu.',
      },
      {
        prompt:
          'Pha trộn 2 kg nước ở 90 °C với 1 kg nước ở 30 °C trong bình cách nhiệt tốt. Tính nhiệt độ cân bằng của hỗn hợp nước thu được.',
        answer: {
          kind: 'numeric',
          value: donViHienThi(70, '°C'),
          unit: '°C',
        },
        explain:
          'Q_toả = Q_thu ⇔ m₁ * c * (t₁ - θ) = m₂ * c * (θ - t₂) ⇔ 2 * (90 - θ) = 1 * (θ - 30) ⇔ 180 - 2θ = θ - 30 ⇔ 3θ = 210 ⇔ θ = 70 °C.',
      },
    ],
    srsCards: [
      {
        hoi: 'Viết công thức tính hiệu suất đun nấu H của một bếp lò.',
        dap: 'H = Q_ích / Q_toànphần (thường nhân 100% để biểu diễn theo phần trăm).',
      },
      {
        hoi: 'Khi giải bài toán pha trộn nước đá ở dưới 0 °C vào nước ấm ở 40 °C, nhiệt lượng thu vào của đá gồm những giai đoạn nào?',
        dap: 'Gồm 3 giai đoạn: 1) Đá nhận nhiệt tăng lên 0 °C; 2) Đá nóng chảy hoàn toàn thành nước ở 0 °C; 3) Nước đá tan tăng nhiệt độ lên nhiệt độ cân bằng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
