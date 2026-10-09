// lessons/sinh10c2.ts — Sinh học 10, Chương 2 & 3 (Bài 7-12).
import type { BiologyLesson } from '../lessonTypes.js'

export const SINH10_C2_LESSONS: BiologyLesson[] = [
  {
    id: 'sinh10-c3-b7',
    animation: {
      title: 'Tế bào nhân sơ dựng từ ngoài vào trong',
      description:
        'Một vi khuẩn hình que được dựng dần từ ngoài vào trong. Đầu tiên là thành tế bào dày bằng peptidoglycan, giữ hình dạng. Bên trong là màng sinh chất mỏng, kiểm soát chất ra vào. Tế bào chất hiện lên cùng các hạt ribosome 70S, nơi tổng hợp protein. Ở giữa là vùng nhân: một phân tử DNA vòng nằm trần trong tế bào chất, không có màng nhân bao quanh; bên cạnh có một plasmid là vòng DNA nhỏ. Tiếp theo là các cấu trúc phụ chỉ có ở một số vi khuẩn: lông roi dài vẫy ở một đầu để di chuyển và các lông nhung ngắn để bám. Cuối cùng các nhãn lùi đi, ba mũi tên chất dinh dưỡng đi vào từ ba phía: tế bào chỉ khoảng 1–5 µm nên tỉ lệ diện tích bề mặt trên thể tích lớn, chất khuếch tán tới mọi điểm rất nhanh, nhờ đó vi khuẩn trao đổi chất và sinh sản nhanh.',
      viewBoxWidth: 600,
      viewBoxHeight: 300,
      durationMs: 13500,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 300,
          y: 22,
          text: 'Tế bào nhân sơ dựng từ ngoài vào trong',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'long-nhung-0',
          x1: 230,
          y1: 108,
          x2: 224,
          y2: 90,
          stroke: 'neutral',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'long-nhung-1',
          x1: 330,
          y1: 107,
          x2: 332,
          y2: 89,
          stroke: 'neutral',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'long-nhung-2',
          x1: 400,
          y1: 110,
          x2: 408,
          y2: 93,
          stroke: 'neutral',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'long-nhung-3',
          x1: 262,
          y1: 222,
          x2: 257,
          y2: 240,
          stroke: 'neutral',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'long-nhung-4',
          x1: 372,
          y1: 222,
          x2: 378,
          y2: 240,
          stroke: 'neutral',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'long-roi',
          points: [
            [450, 165],
            [457.5, 169.95],
            [465, 172],
            [472.5, 169.95],
            [480, 165],
            [487.5, 160.05],
            [495, 158],
            [502.5, 160.05],
            [510, 165],
            [517.5, 169.95],
            [525, 172],
            [532.5, 169.95],
            [540, 165],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              rotate: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              rotate: 0,
              opacity: 0,
            },
            {
              atMs: 8900,
              rotate: 0,
              opacity: 1,
            },
            {
              atMs: 9300,
              rotate: -7,
              opacity: 1,
            },
            {
              atMs: 9700,
              rotate: 7,
              opacity: 1,
            },
            {
              atMs: 10100,
              rotate: -7,
              opacity: 1,
            },
            {
              atMs: 10500,
              rotate: 7,
              opacity: 1,
            },
            {
              atMs: 10900,
              rotate: 0,
              opacity: 1,
            },
          ],
          origin: [450, 165],
        },
        {
          kind: 'rect',
          id: 'thanh',
          x: 170,
          y: 105,
          w: 280,
          h: 120,
          rx: 60,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 6,
        },
        {
          kind: 'rect',
          id: 'mang',
          x: 181,
          y: 116,
          w: 258,
          h: 98,
          rx: 49,
          stroke: 'neutral',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-0',
          cx: 220,
          cy: 140,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-1',
          cx: 236,
          cy: 196,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4520,
              opacity: 0,
            },
            {
              atMs: 4820,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-2',
          cx: 262,
          cy: 128,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4640,
              opacity: 0,
            },
            {
              atMs: 4940,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-3',
          cx: 345,
          cy: 132,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4760,
              opacity: 0,
            },
            {
              atMs: 5060,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-4',
          cx: 362,
          cy: 202,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4880,
              opacity: 0,
            },
            {
              atMs: 5180,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-5',
          cx: 408,
          cy: 146,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5000,
              opacity: 0,
            },
            {
              atMs: 5300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-6',
          cx: 322,
          cy: 208,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5120,
              opacity: 0,
            },
            {
              atMs: 5420,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ribo-7',
          cx: 204,
          cy: 170,
          r: 3.5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5240,
              opacity: 0,
            },
            {
              atMs: 5540,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'dna-vong',
          points: [
            [331, 163],
            [333.73, 169.09],
            [328.98, 173.97],
            [322.39, 176.83],
            [319.79, 181.68],
            [317.02, 188.05],
            [310.22, 189.72],
            [302.97, 187.01],
            [297.03, 187.01],
            [289.78, 189.72],
            [282.98, 188.05],
            [280.21, 181.68],
            [277.61, 176.83],
            [271.02, 173.97],
            [266.27, 169.09],
            [269, 163],
            [273.08, 158.14],
            [272.34, 152.53],
            [272.23, 145.85],
            [278.3, 142.52],
            [286.02, 142.41],
            [291.06, 139.6],
            [296.49, 134.6],
            [303.51, 134.6],
            [308.94, 139.6],
            [313.98, 142.41],
            [321.7, 142.52],
            [327.77, 145.85],
            [327.66, 152.53],
            [326.92, 158.14],
          ],
          closed: true,
          stroke: 'danger',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6600,
              opacity: 0,
            },
            {
              atMs: 6900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'plasmid',
          cx: 397,
          cy: 186,
          r: 9,
          stroke: 'danger',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7100,
              opacity: 0,
            },
            {
              atMs: 7400,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'dan-thanh',
          x1: 163,
          y1: 151,
          x2: 172,
          y2: 153,
          stroke: 'muted',
          strokeWidth: 1,
          opacity: 1,
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-thanh',
          x: 160,
          y: 150,
          text: 'Thành tế bào',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          opacity: 1,
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-thanh-b',
          x: 160,
          y: 164,
          text: 'peptidoglycan',
          size: 10,
          anchor: 'end',
          fill: 'muted',
          opacity: 1,
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'dan-mang',
          x1: 163,
          y1: 196,
          x2: 186,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 1,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2500,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-mang',
          x: 160,
          y: 196,
          text: 'Màng sinh chất',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2500,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-mang-b',
          x: 160,
          y: 210,
          text: 'kiểm soát chất ra vào',
          size: 10,
          anchor: 'end',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2500,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'dan-rb',
          x1: 262,
          y1: 76,
          x2: 262,
          y2: 122,
          stroke: 'muted',
          strokeWidth: 1,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-rb',
          x: 262,
          y: 70,
          text: 'Ribosome 70S: tổng hợp protein',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'dan-nhan',
          x1: 300,
          y1: 252,
          x2: 300,
          y2: 193,
          stroke: 'muted',
          strokeWidth: 1,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6600,
              opacity: 0,
            },
            {
              atMs: 6900,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-nhan',
          x: 300,
          y: 264,
          text: 'Vùng nhân: DNA vòng nằm trần, KHÔNG có màng nhân',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6600,
              opacity: 0,
            },
            {
              atMs: 6900,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'dan-plasmid',
          x1: 466,
          y1: 207,
          x2: 405,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 1,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7100,
              opacity: 0,
            },
            {
              atMs: 7400,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-plasmid',
          x: 470,
          y: 214,
          text: 'Plasmid',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7100,
              opacity: 0,
            },
            {
              atMs: 7400,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-roi',
          x: 548,
          y: 140,
          text: 'Lông roi',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-nhung',
          x: 416,
          y: 86,
          text: 'Lông nhung',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-phu',
          x: 592,
          y: 246,
          text: 'Lông roi, lông nhung:',
          size: 10,
          anchor: 'end',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-phu-2',
          x: 592,
          y: 259,
          text: 'chỉ có ở một số vi khuẩn',
          size: 10,
          anchor: 'end',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8600,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 1,
            },
            {
              atMs: 10600,
              opacity: 1,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'vao-tren',
          x1: 310,
          y1: 44,
          x2: 310,
          y2: 100,
          stroke: 'correct',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              dy: -14,
              opacity: 0,
            },
            {
              atMs: 10800,
              dy: -14,
              opacity: 0,
            },
            {
              atMs: 11100,
              dy: -10.5,
              opacity: 1,
            },
            {
              atMs: 12000,
              dy: 0,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'vao-trai',
          x1: 110,
          y1: 120,
          x2: 170,
          y2: 152,
          stroke: 'correct',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              dx: -14,
              dy: -7,
              opacity: 0,
            },
            {
              atMs: 10800,
              dx: -14,
              dy: -7,
              opacity: 0,
            },
            {
              atMs: 11100,
              dx: -10.5,
              dy: -5.25,
              opacity: 1,
            },
            {
              atMs: 12000,
              dx: 0,
              dy: 0,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'vao-phai',
          x1: 510,
          y1: 92,
          x2: 440,
          y2: 126,
          stroke: 'correct',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              dx: 14,
              dy: -7,
              opacity: 0,
            },
            {
              atMs: 10800,
              dx: 14,
              dy: -7,
              opacity: 0,
            },
            {
              atMs: 11100,
              dx: 10.5,
              dy: -5.25,
              opacity: 1,
            },
            {
              atMs: 12000,
              dx: 0,
              dy: 0,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-sv',
          x: 310,
          y: 262,
          text: 'Rất nhỏ, chỉ ≈ 1–5 µm → tỉ lệ S/V lớn',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
            {
              atMs: 11200,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-sv-b',
          x: 310,
          y: 280,
          text: 'chất khuếch tán tới mọi điểm rất nhanh → sinh sản nhanh',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10900,
              opacity: 0,
            },
            {
              atMs: 11200,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Thành tế bào bằng peptidoglycan bọc ngoài cùng, giữ hình dạng tế bào.',
        },
        {
          atMs: 2200,
          text: 'Bên trong thành là màng sinh chất, kiểm soát chất ra vào.',
        },
        {
          atMs: 4400,
          text: 'Tế bào chất chứa ribosome 70S, bào quan duy nhất, nơi tổng hợp protein.',
        },
        {
          atMs: 6600,
          text: 'Vùng nhân là DNA vòng nằm trần, không có màng nhân. Plasmid là vòng DNA nhỏ ngoài vùng nhân.',
        },
        {
          atMs: 8600,
          text: 'Một số vi khuẩn có thêm lông roi để di chuyển và lông nhung để bám.',
        },
        {
          atMs: 10600,
          text: 'Tế bào rất nhỏ nên tỉ lệ S/V lớn: trao đổi chất nhanh, sinh sản nhanh.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Cấu trúc tế bào',
    lessonNumber: 7,
    title: 'Tế bào nhân sơ',
    hook:
      'Hàng tỉ vi khuẩn đang sống trong ruột bạn ngay lúc này, giúp bạn tiêu hoá thức ăn. ' +
      'Chúng thuộc dạng tế bào đơn giản nhất, nhưng cũng có thể làm khổ sở bạn với đủ loại bệnh tật.',
    theory:
      '## Tế bào nhân sơ (prokaryotic cell - nhân nguyên sơ)\n' +
      '— Định nghĩa: Là loại tế bào chưa có màng nhân (không có nhân thật sự), vật chất di truyền (DNA dạng vòng, không cuộn chặt với protein histone) nằm trực tiếp trong tế bào chất (vùng nhân - nucleoid).\n' +
      '— Đại diện: Vi khuẩn (Bacteria) và Cổ khuẩn (Archaea).\n\n' +
      '## Cấu trúc tế bào vi khuẩn\n' +
      '1. Thành tế bào (Cell wall): Cấu tạo từ peptidoglycan. Bảo vệ tế bào, duy trì hình dạng cố định.\n' +
      '2. Màng sinh chất (Plasma membrane): Lớp kép phospholipid nằm bên trong thành tế bào. Kiểm soát sự trao đổi chất với môi trường.\n' +
      '3. Tế bào chất (Cytoplasm): Dung dịch nước (cytosol) chứa các phân tử hữu cơ và ribosome. Không có màng bao. Nơi diễn ra các phản ứng trao đổi chất.\n' +
      '4. Vùng nhân (Nucleoid): Chứa một phân tử DNA vòng kép không gắn với protein histone.\n' +
      '5. Ribosome: Là bào quan duy nhất của tế bào nhân sơ, nhỏ hơn ribosome tế bào nhân thực (70S so với 80S). Nơi tổng hợp protein.\n' +
      '— Các cấu trúc phụ của một số vi khuẩn: Lông roi (Flagellum - giúp di chuyển), Lông nhung (Pilus/Fimbria - giúp bám dính), Vỏ nhày (Capsule - bảo vệ chống thực bào), Plasmid (phân tử DNA vòng nhỏ nằm ngoài vùng nhân).',
    workedExample: {
      problem:
        'So sánh sự khác nhau cơ bản giữa tế bào nhân sơ và tế bào nhân thực về cấu trúc nhân.',
      steps: [
        'Tế bào nhân sơ: Không có màng nhân. Vật chất di truyền (DNA vòng) phân tán trong tế bào chất ở vùng nhân (nucleoid), không có màng bao riêng.',
        'Tế bào nhân thực: Có màng nhân (nuclear envelope) bao bọc rõ ràng, tạo ra khoang nhân (nucleus) tách biệt với tế bào chất.',
        'Kết luận: Sự có hay không có màng nhân là tiêu chí cơ bản nhất để phân biệt tế bào nhân sơ và tế bào nhân thực.',
      ],
      answer:
        'Tế bào nhân sơ không có màng nhân; DNA trần trong vùng nhân (nucleoid). Tế bào nhân thực có màng nhân bao bọc.',
    },
    checkQuestions: [
      {
        prompt: 'Đặc điểm nào sau đây là ĐÚNG đối với tế bào nhân sơ?',
        choices: [
          { id: 'ns_1', label: 'Không có màng nhân bao bọc vật chất di truyền' },
          { id: 'ns_2', label: 'Có nhiều loại bào quan có màng như mitochondria và lục lạp' },
          { id: 'ns_3', label: 'Ribosome có kích thước 80S' },
          { id: 'ns_4', label: 'DNA cuộn chặt với protein histone' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ns_1'],
        },
        explain:
          'Tế bào nhân sơ không có màng nhân - đây là điểm phân biệt cơ bản với tế bào nhân thực. Ribosome của tế bào nhân sơ cũng nhỏ hơn (70S không phải 80S).',
      },
      {
        prompt: 'Bào quan nào sau đây CÓ MẶT trong cả tế bào nhân sơ lẫn tế bào nhân thực?',
        choices: [
          { id: 'bq_1', label: 'Ribosome' },
          { id: 'bq_2', label: 'Ty thể (Mitochondria)' },
          { id: 'bq_3', label: 'Lưới nội chất (Endoplasmic Reticulum)' },
          { id: 'bq_4', label: 'Bộ máy Golgi' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['bq_1'],
        },
        explain:
          'Ribosome là bào quan duy nhất hiện diện trong cả tế bào nhân sơ lẫn nhân thực, vì tất cả tế bào đều cần tổng hợp protein.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đặc điểm cơ bản nhất của tế bào nhân sơ là gì?',
        dap: 'Không có màng nhân. Vật chất di truyền (DNA vòng trần) phân bố trong tế bào chất ở vùng nhân (nucleoid).',
      },
      {
        hoi: 'Thành tế bào vi khuẩn được cấu tạo từ vật liệu gì?',
        dap: 'Peptidoglycan.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c3-b8',
    animation: {
      title: 'Đường đi của protein tiết trong tế bào nhân thực',
      description:
        'Hình vẽ một tế bào nhân thực với nhân ở góc trái, lưới nội chất hạt sát nhân, bộ máy Golgi ở giữa và màng sinh chất ở bên phải. Một chấm sáng đại diện cho protein mới sinh chạy suốt hành trình: gene trong NHÂN được phiên mã thành mARN, mARN chui qua lỗ màng nhân ra tế bào chất, ribosome bám trên LƯỚI NỘI CHẤT HẠT dịch mã tạo chuỗi polypeptide và đẩy nó vào trong lòng lưới; lưới nội chất đóng gói protein vào túi vận chuyển, túi trôi tới BỘ MÁY GOLGI để hoàn thiện và dán nhãn địa chỉ; cuối cùng túi tiết đi ra màng sinh chất và xuất bào. Điều hình động cho thấy rõ hơn mọi câu chữ: các bào quan không nằm rời rạc mà là một dây chuyền có thứ tự bắt buộc.',
      viewBoxWidth: 500,
      viewBoxHeight: 260,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'te-bao',
          x: 8,
          y: 30,
          w: 484,
          h: 210,
          rx: 40,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 2,
        },
        { kind: 'circle', id: 'nhan', cx: 86, cy: 135, r: 44, fill: 'primary', opacity: 0.85 },
        {
          kind: 'label',
          id: 'l-nhan',
          x: 86,
          y: 140,
          text: 'Nhân',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'polyline',
          id: 'lnc',
          points: [
            [150, 80],
            [188, 100],
            [150, 120],
            [188, 140],
            [150, 160],
            [188, 180],
          ],
          stroke: 'accent',
          strokeWidth: 4,
        },
        { kind: 'circle', id: 'ribo1', cx: 194, cy: 100, r: 3.5, fill: 'primary' },
        { kind: 'circle', id: 'ribo2', cx: 194, cy: 140, r: 3.5, fill: 'primary' },
        { kind: 'circle', id: 'ribo3', cx: 194, cy: 180, r: 3.5, fill: 'primary' },
        { kind: 'circle', id: 'ribo4', cx: 144, cy: 80, r: 3.5, fill: 'primary' },
        { kind: 'circle', id: 'ribo5', cx: 144, cy: 120, r: 3.5, fill: 'primary' },
        { kind: 'circle', id: 'ribo6', cx: 144, cy: 160, r: 3.5, fill: 'primary' },
        {
          kind: 'label',
          id: 'l-lnc',
          x: 172,
          y: 66,
          text: 'Lưới nội chất hạt (có ribosome)',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'golgi',
          points: [
            [270, 100],
            [330, 100],
          ],
          stroke: 'primary',
          strokeWidth: 5,
        },
        {
          kind: 'polyline',
          id: 'golgi2',
          points: [
            [266, 118],
            [334, 118],
          ],
          stroke: 'primary',
          strokeWidth: 5,
        },
        {
          kind: 'polyline',
          id: 'golgi3',
          points: [
            [270, 136],
            [330, 136],
          ],
          stroke: 'primary',
          strokeWidth: 5,
        },
        {
          kind: 'label',
          id: 'l-golgi',
          x: 300,
          y: 88,
          text: 'Bộ máy Golgi',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'l-mang',
          x: 484,
          y: 58,
          text: 'Màng sinh chất',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'circle',
          id: 'san-pham',
          cx: 86,
          cy: 135,
          r: 8,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 30, dy: -20, opacity: 0 },
            { atMs: 800, dx: 30, dy: -20, opacity: 1 },
            { atMs: 2400, dx: 82, dy: -25, opacity: 1 },
            { atMs: 4200, dx: 102, dy: 25, opacity: 1 },
            { atMs: 5600, dx: 214, dy: -17, opacity: 1 },
            { atMs: 6800, dx: 214, dy: 1, opacity: 1 },
            { atMs: 8200, dx: 374, dy: 5, opacity: 1 },
            { atMs: 9000, dx: 410, dy: 5, opacity: 0.2 },
          ],
        },
        {
          kind: 'arrow',
          id: 'xuat-bao',
          x1: 440,
          y1: 140,
          x2: 498,
          y2: 140,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7800, opacity: 0 },
            { atMs: 8200, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 800, text: 'Trong nhân, gene được phiên mã thành mARN.' },
        {
          atMs: 2400,
          text: 'mARN qua lỗ màng nhân, ribosome trên lưới nội chất hạt dịch mã thành chuỗi polypeptide.',
        },
        { atMs: 4200, text: 'Lưới nội chất đóng gói protein vào túi vận chuyển.' },
        {
          atMs: 5600,
          text: 'Túi trôi tới bộ máy Golgi: protein được hoàn thiện và dán nhãn địa chỉ.',
        },
        {
          atMs: 8200,
          text: 'Túi tiết ra màng sinh chất và xuất bào — các bào quan là một dây chuyền có thứ tự.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Cấu trúc tế bào',
    lessonNumber: 8,
    title: 'Tế bào nhân thực',
    hook: 'Mỗi tế bào trong cơ thể bạn giống như một siêu đô thị vi mô. Bên trong nó, hàng nghìn bào quan hoạt động 24/7 như các nhà máy, trung tâm điều khiển và nhà kho.',
    theory:
      '## Tế bào nhân thực (eukaryotic cell)\n' +
      '— Có nhân thật sự được bao bọc bởi màng nhân.\n' +
      '— Đại diện: Tế bào động vật, thực vật, nấm, động vật nguyên sinh.\n\n' +
      '## Các bào quan chính và chức năng\n' +
      '1. Nhân (Nucleus): Chứa DNA và nucleolus. Trung tâm điều khiển mọi hoạt động tế bào, bảo quản thông tin di truyền.\n' +
      '2. Ty thể (Mitochondria): Có màng kép (outer + inner membrane), có DNA và ribosome riêng. Sản xuất ATP qua hô hấp tế bào (trạm năng lượng tế bào).\n' +
      '3. Lưới nội chất (Endoplasmic Reticulum - ER):\n' +
      '   — ER thô (có ribosome bám): Tổng hợp và vận chuyển protein tiết.\n' +
      '   — ER trơn (không có ribosome): Tổng hợp lipid, chuyển hoá thuốc/độc chất.\n' +
      '4. Bộ máy Golgi (Golgi apparatus): Phân loại, đóng gói và vận chuyển các phân tử (xuất bào).\n' +
      '5. Ribosome: Gắn ER thô hoặc tự do trong tế bào chất. Tổng hợp protein.\n' +
      '6. Lysosome (ở tế bào động vật): Chứa enzyme tiêu hoá nội bào. Tiêu hoá các phân tử lớn, bào quan hỏng.\n' +
      '7. Không bào (Vacuole): Lớn ở tế bào thực vật (trung tâm không bào - chứa dịch tế bào), nhỏ ở tế bào động vật.\n' +
      '8. Lục lạp (Chloroplast - chỉ có ở tế bào thực vật và tảo): Có màng kép và DNA riêng. Quang hợp chuyển hoá năng lượng ánh sáng thành năng lượng hoá học.\n' +
      '9. Thành tế bào (Cell wall - ở tế bào thực vật, nấm): Cấu tạo từ cellulose (thực vật) hoặc chitin (nấm). Bảo vệ và duy trì hình dạng.\n' +
      '10. Màng sinh chất (Plasma membrane): Bao xung quanh mọi tế bào, kiểm soát sự trao đổi chất.',
    workedExample: {
      problem: 'Tại sao một số nhà khoa học lại gọi ty thể là "trạm điện" của tế bào?',
      steps: [
        'Mô tả cấu trúc ty thể: Có màng kép gồm màng ngoài nhẵn và màng trong gấp nếp thành các mào (cristae). Chứa DNA vòng và ribosome kiểu nhân sơ riêng.',
        'Mô tả chức năng: Ty thể thực hiện quá trình hô hấp hiếu khí (aerobic respiration) bằng cách oxi hoá hoàn toàn glucose thành CO₂ và H₂O, giải phóng phần lớn năng lượng hoá học dưới dạng ATP.',
        'Kết luận: ATP (adenosine triphosphate) là đồng tiền năng lượng phổ quát của tế bào. Ty thể sản xuất ra phần lớn ATP dùng cho mọi hoạt động tế bào, do đó được gọi là "trạm điện" hay "nhà máy năng lượng".',
      ],
      answer:
        'Ty thể thực hiện hô hấp hiếu khí sản xuất ra phần lớn ATP — đồng tiền năng lượng phổ quát của tế bào.',
    },
    checkQuestions: [
      {
        prompt: 'Bào quan nào sau đây CHỈ CÓ ở tế bào thực vật mà không có ở tế bào động vật?',
        choices: [
          { id: 'tv_1', label: 'Lục lạp và thành tế bào cellulose' },
          { id: 'tv_2', label: 'Ribosome và ty thể' },
          { id: 'tv_3', label: 'Bộ máy Golgi và nhân' },
          { id: 'tv_4', label: 'Lysosome và màng sinh chất' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['tv_1'],
        },
        explain:
          'Lục lạp (quang hợp) và thành tế bào cellulose là đặc trưng của tế bào thực vật. Ribosome, ty thể, bộ máy Golgi và nhân đều có ở cả hai.',
      },
      {
        prompt:
          'Bào quan nào sau đây chịu trách nhiệm phân loại và đóng gói các protein để vận chuyển đến đích?',
        choices: [
          { id: 'go_1', label: 'Bộ máy Golgi' },
          { id: 'go_2', label: 'Lưới nội chất thô' },
          { id: 'go_3', label: 'Lysosome' },
          { id: 'go_4', label: 'Không bào' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['go_1'],
        },
        explain:
          'Bộ máy Golgi nhận túi vận chuyển từ lưới nội chất, hoàn thiện rồi dán nhãn địa chỉ cho protein và lipid nên đây là khâu phân loại, đóng gói. Lưới nội chất hạt chỉ tổng hợp protein rồi gửi đi, lysosome tiêu hoá nội bào, còn không bào làm nhiệm vụ dự trữ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Bào quan nào trong tế bào động vật có chức năng tiêu hoá nội bào và loại bỏ bào quan hỏng?',
        dap: 'Lysosome.',
      },
      {
        hoi: 'Nêu điểm khác biệt về cấu trúc của lưới nội chất thô và lưới nội chất trơn?',
        dap: 'ER thô có ribosome bám vào mặt ngoài, ER trơn không có ribosome.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c3-b9',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Cấu trúc tế bào',
    lessonNumber: 9,
    title: 'Thực hành: Quan sát tế bào',
    hook: 'Sử dụng kính hiển vi, chúng ta sẽ thực sự "nhìn thấy" thế giới tế bào mà mắt thường không bao giờ thấy được: hình dạng tế bào biểu bì hành tây và các bào quan của nó.',
    theory:
      '## Kính hiển vi và kĩ thuật làm tiêu bản tế bào\n' +
      '1. Kính hiển vi quang học (Light microscope): Dùng ánh sáng thông thường và thấu kính để phóng to mẫu. Độ phóng đại tối đa khoảng 1000-1500 lần. Quan sát được hình dạng và một số bào quan lớn.\n' +
      '2. Kính hiển vi điện tử (Electron microscope): Dùng chùm electron, độ phóng đại lên đến hàng chục nghìn đến vài triệu lần. Quan sát được cấu trúc chi tiết các bào quan và vật thể nano.\n\n' +
      '## Quy trình làm tiêu bản hiển vi\n' +
      '1. Chuẩn bị mẫu: Bóc lớp biểu bì mỏng của hành tây.\n' +
      '2. Đặt mẫu lên lam kính, nhỏ 1-2 giọt nước cất lên mẫu.\n' +
      '3. Đậy lamela (lá kính) nhẹ nhàng, tránh tạo bọt khí.\n' +
      '4. Nhỏ thuốc nhuộm màu (dung dịch xanh methylene hoặc lugol) vào rìa lamela.\n' +
      '5. Đặt lên bàn kính và quan sát từ vật kính bé (10x) đến vật kính lớn hơn (40x).',
    workedExample: {
      problem: 'Mô tả quy trình quan sát tế bào biểu bì hành tây qua kính hiển vi quang học.',
      steps: [
        'Bóc một lớp biểu bì mỏng trong suốt ở mặt trong của vảy hành tây bằng kim mũi giáo và kẹp đầu nhọn.',
        'Đặt nhẹ lớp biểu bì lên giữa lam kính đã được vệ sinh sạch, trải phẳng bằng kim.',
        'Nhỏ vài giọt nước hoặc thuốc nhuộm xanh methylene 0,5%, đậy lamela bằng cách nghiêng một bên rồi hạ từ từ tránh bọt khí.',
        'Quan sát dưới kính hiển vi ở độ phóng đại 10x, sau đó chuyển sang 40x để quan sát rõ hơn.',
      ],
      answer:
        'Bóc biểu bì -> đặt lên lam -> nhuộm màu -> đậy lamela -> quan sát dưới kính từ độ phóng đại thấp lên cao.',
    },
    checkQuestions: [
      {
        prompt:
          'Loại kính hiển vi nào có độ phóng đại cao hơn và cho phép quan sát chi tiết cấu trúc bào quan?',
        choices: [
          { id: 'km_1', label: 'Kính hiển vi điện tử' },
          { id: 'km_2', label: 'Kính hiển vi quang học thông thường' },
          { id: 'km_3', label: 'Kính lúp thực địa' },
          { id: 'km_4', label: 'Kính viễn vọng thiên văn' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['km_1'],
        },
        explain:
          'Kính hiển vi điện tử dùng chùm electron với bước sóng nhỏ hơn nhiều, cho độ phóng đại cao hơn hàng nghìn lần so với kính hiển vi quang học.',
      },
      {
        prompt: 'Khi làm tiêu bản hiển vi, ta nhỏ thuốc nhuộm màu vào rìa lamela với mục đích gì?',
        choices: [
          {
            id: 'nd_1',
            label: 'Để thuốc nhuộm thấm vào mẫu nhờ lực mao dẫn, tăng độ tương phản khi quan sát',
          },
          { id: 'nd_2', label: 'Để bảo quản mẫu tránh hư hỏng' },
          { id: 'nd_3', label: 'Để cố định lamela không bị dịch chuyển' },
          { id: 'nd_4', label: 'Để tạo độ ẩm cho mẫu sinh học' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['nd_1'],
        },
        explain:
          'Thuốc nhuộm màu giúp tăng độ tương phản giữa các cấu trúc tế bào với nền trong suốt, giúp quan sát rõ hơn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu tên hai loại kính hiển vi chính dùng trong nghiên cứu tế bào?',
        dap: 'Kính hiển vi quang học (dùng ánh sáng) và kính hiển vi điện tử (dùng chùm electron).',
      },
      {
        hoi: 'Tại sao khi đậy lamela phải nghiêng một cạnh rồi hạ xuống từ từ?',
        dap: 'Để tránh tạo bọt khí trong mẫu, bọt khí sẽ làm biến dạng và khó quan sát tế bào.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c4-b10',
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Trao đổi chất qua màng và truyền tin tế bào',
    lessonNumber: 10,
    title: 'Trao đổi chất qua màng tế bào',
    hook:
      'Màng tế bào không phải bức tường cứng mà là cửa kiểm soát năng động, chọn lọc cái gì vào và ra. ' +
      'Mỗi giây, hàng tỉ phân tử và ion đang di chuyển qua lớp màng mỏng chỉ bằng vài nanomét này.',
    theory:
      '## Màng sinh chất (plasma membrane)\n' +
      '— Cấu trúc khảm lỏng (Fluid mosaic model): Lớp kép phospholipid linh động, trên đó các protein màng nằm rải rác và di chuyển được. Có thể có cholesterol (ở tế bào động vật) để ổn định độ lỏng của màng.\n\n' +
      '## Các con đường trao đổi chất qua màng\n' +
      '1. Khuếch tán thụ động (Passive transport - không cần năng lượng ATP):\n' +
      '   — Khuếch tán đơn giản (Simple diffusion): Các phân tử nhỏ không phân cực, không tích điện (O₂, CO₂, N₂, các phân tử kị nước) thấm trực tiếp qua lớp kép phospholipid từ nơi nồng độ cao sang thấp.\n' +
      '   — Khuếch tán có hỗ trợ (Facilitated diffusion): Các phân tử ưa nước hoặc ion đi qua màng nhờ protein kênh (channel protein) hoặc protein vận chuyển (carrier protein) từ cao xuống thấp.\n' +
      '   — Thẩm thấu (Osmosis): Sự khuếch tán của nước qua màng bán thấm từ dung dịch nhược trương sang ưu trương.\n' +
      '2. Vận chuyển chủ động (Active transport - cần năng lượng ATP):\n' +
      '   — Di chuyển chất từ nơi nồng độ thấp đến cao (ngược gradient) cần protein vận chuyển đặc biệt và ATP.\n' +
      '   — Ví dụ: Bơm Na⁺-K⁺ trong tế bào thần kinh.\n' +
      '3. Nhập bào (Endocytosis) và xuất bào (Exocytosis): Đưa các phân tử lớn qua màng bằng cách màng biến dạng, gói chất vào túi rồi đưa vào trong hoặc đẩy ra ngoài.\n\n' +
      '## Hiện tượng co nguyên sinh và phản co nguyên sinh\n' +
      '— Co nguyên sinh (Plasmolysis): Tế bào thực vật đặt trong dung dịch ưu trương, nước rời khỏi không bào, màng sinh chất tách khỏi thành tế bào.\n' +
      '— Phản co nguyên sinh: Tế bào đã co nguyên sinh được đặt vào nước hoặc dung dịch nhược trương, nước thấm vào lại.',
    workedExample: {
      problem:
        'Giải thích tại sao rau xà lách bị héo khi bóp muối quá mặn, nhưng có thể hồi phục khi ngâm vào nước lạnh?',
      steps: [
        'Khi rưới muối (hoặc nước muối mặn), tạo ra nồng độ muối bên ngoài cao hơn bên trong tế bào (dung dịch ưu trương bên ngoài).',
        'Theo nguyên lí thẩm thấu, nước từ trong tế bào (nơi nồng độ chất tan thấp hơn) di chuyển ra ngoài, làm tế bào mất nước.',
        'Kết quả: Không bào co lại, tế bào xẹp xuống => rau bị héo (co nguyên sinh).',
        'Khi ngâm vào nước lạnh: Nồng độ chất tan bên ngoài thấp hơn bên trong tế bào, nước thấm ngược vào tế bào (phản co nguyên sinh), tế bào căng lại, rau hồi phục.',
      ],
      answer:
        'Muối tạo dung dịch ưu trương làm nước rời khỏi tế bào (co nguyên sinh). Ngâm nước lạnh làm nước thấm trở lại (phản co nguyên sinh).',
    },
    checkQuestions: [
      {
        prompt: 'Phương thức vận chuyển nào sau đây KHÔNG cần tiêu tốn năng lượng ATP?',
        choices: [
          { id: 'vt_1', label: 'Khuếch tán thụ động' },
          { id: 'vt_2', label: 'Vận chuyển chủ động' },
          { id: 'vt_3', label: 'Nhập bào (Endocytosis)' },
          { id: 'vt_4', label: 'Xuất bào (Exocytosis)' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['vt_1'],
        },
        explain:
          'Khuếch tán thụ động (bao gồm khuếch tán đơn giản, khuếch tán có hỗ trợ và thẩm thấu) di chuyển chất theo chiều gradient nồng độ, không cần tiêu tốn ATP.',
      },
      {
        prompt:
          'Hiện tượng nào xảy ra khi tế bào thực vật được đặt trong dung dịch ưu trương (hypertonic)?',
        choices: [
          { id: 'ut_1', label: 'Co nguyên sinh (Plasmolysis)' },
          { id: 'ut_2', label: 'Phản co nguyên sinh' },
          { id: 'ut_3', label: 'Tế bào bị vỡ do áp suất thẩm thấu' },
          { id: 'ut_4', label: 'Không có hiện tượng gì xảy ra' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ut_1'],
        },
        explain:
          'Trong dung dịch ưu trương, nồng độ chất tan bên ngoài > bên trong, nước thấm ra ngoài, không bào co lại và màng sinh chất tách khỏi thành tế bào (co nguyên sinh).',
      },
    ],
    srsCards: [
      {
        hoi: 'Thẩm thấu là gì?',
        dap: 'Sự khuếch tán của nước qua màng bán thấm từ dung dịch nhược trương (ít chất tan hơn) sang dung dịch ưu trương (nhiều chất tan hơn).',
      },
      {
        hoi: 'Sự khác biệt cơ bản giữa khuếch tán thụ động và vận chuyển chủ động?',
        dap: 'Khuếch tán thụ động theo chiều gradient nồng độ, không cần ATP. Vận chuyển chủ động ngược gradient nồng độ, cần tiêu tốn ATP.',
      },
    ],
    animation: {
      title: 'Ba kiểu vận chuyển các chất qua màng sinh chất',
      description:
        'Màng sinh chất vẽ thành hai lớp phospholipid nằm ngang giữa hình, phía trên là ngoài tế bào có nhiều hạt chất tan, phía dưới là trong tế bào chỉ có vài hạt. Ba đường đi được minh hoạ song song: (1) khuếch tán đơn giản — phân tử nhỏ không phân cực tự lọt qua lớp lipid, đi từ nơi nồng độ cao xuống nơi nồng độ thấp, không tốn năng lượng; (2) khuếch tán tăng cường — phân tử phân cực chui qua kênh protein, vẫn xuôi chiều gradient nên vẫn không tốn ATP, nhưng tốc độ phụ thuộc số kênh nên sẽ bão hoà; (3) vận chuyển chủ động — bơm protein đẩy chất tan NGƯỢC chiều gradient, từ nơi ít sang nơi nhiều, nên bắt buộc tiêu tốn ATP. Điểm cốt lõi: chiều gradient quyết định có tốn năng lượng hay không, còn có đi qua protein hay không chỉ quyết định tốc độ.',
      viewBoxWidth: 420,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        { kind: 'rect', id: 'ngoai', x: 0, y: 0, w: 420, h: 96, fill: 'surface', opacity: 0.35 },
        { kind: 'circle', id: 'ngoai0', cx: 24, cy: 60, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai1', cx: 118, cy: 72, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai2', cx: 150, cy: 54, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai3', cx: 262, cy: 62, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai4', cx: 292, cy: 80, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai5', cx: 388, cy: 58, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai6', cx: 404, cy: 82, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai7', cx: 36, cy: 84, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai8', cx: 250, cy: 86, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'ngoai9', cx: 120, cy: 54, r: 4, fill: 'muted' },
        { kind: 'rect', id: 'mang1', x: 0, y: 96, w: 420, h: 14, fill: 'muted' },
        { kind: 'rect', id: 'mang2', x: 0, y: 126, w: 420, h: 14, fill: 'muted' },
        { kind: 'rect', id: 'kenh', x: 196, y: 92, w: 26, h: 52, rx: 6, fill: 'accent' },
        { kind: 'rect', id: 'bom', x: 327, y: 92, w: 26, h: 52, rx: 6, fill: 'primary' },
        { kind: 'circle', id: 'trong0', cx: 124, cy: 172, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'trong1', cx: 272, cy: 184, r: 4, fill: 'muted' },
        { kind: 'circle', id: 'trong2', cx: 34, cy: 160, r: 4, fill: 'muted' },
        {
          kind: 'label',
          id: 'lb-ngoai',
          x: 8,
          y: 18,
          text: 'Ngoài tế bào (nồng độ CAO)',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-trong',
          x: 8,
          y: 234,
          text: 'Trong tế bào (nồng độ THẤP)',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb1',
          x: 70,
          y: 38,
          text: '1. Khuếch tán đơn giản',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb2',
          x: 209,
          y: 38,
          text: '2. Qua kênh protein',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb3',
          x: 340,
          y: 38,
          text: '3. Bơm chủ động',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'kt1',
          cx: 70,
          cy: 60,
          r: 8,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 3000, dy: 130 },
            { atMs: 8000, dy: 130, opacity: 0.3 },
          ],
        },
        {
          kind: 'circle',
          id: 'kt2',
          cx: 209,
          cy: 60,
          r: 8,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 4000, dy: 130 },
            { atMs: 8000, dy: 130, opacity: 0.3 },
          ],
        },
        {
          kind: 'circle',
          id: 'kt3',
          cx: 340,
          cy: 190,
          r: 8,
          fill: 'danger',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 5000, dy: -130 },
            { atMs: 8000, dy: -130, opacity: 0.3 },
          ],
        },
        {
          kind: 'arrow',
          id: 'atp-arrow',
          x1: 392,
          y1: 176,
          x2: 358,
          y2: 146,
          stroke: 'danger',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'lb3b',
          x: 396,
          y: 192,
          text: 'ATP',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'lb1b',
          x: 70,
          y: 212,
          text: 'không tốn ATP',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'lb2b',
          x: 209,
          y: 212,
          text: 'không tốn ATP',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'lb3c',
          x: 316,
          y: 212,
          text: 'TỐN ATP',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
      ],
      captions: [
        { atMs: 0, text: 'Ngoài tế bào nồng độ chất tan cao hơn trong tế bào.' },
        { atMs: 2500, text: 'Xuôi chiều gradient: chất tự đi xuống, tế bào không phải trả ATP.' },
        {
          atMs: 5000,
          text: 'Ngược chiều gradient: bơm protein phải dùng ATP mới đẩy được chất lên.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c4-b11',
    animation: {
      title: 'Co nguyên sinh và phản co nguyên sinh ở tế bào biểu bì hành',
      description:
        'Một tế bào thực vật vẽ thành hình chữ nhật: khung ngoài là THÀNH tế bào bằng cellulose, bên trong là khối chất nguyên sinh áp sát thành. Khi nhỏ dung dịch muối ưu trương lên tiêu bản, nước trong tế bào đi ra ngoài theo thẩm thấu, khối chất nguyên sinh teo lại và TÁCH khỏi thành, để lộ khoảng trống giữa màng và thành — đó là co nguyên sinh; thành tế bào cứng nên hình dạng bên ngoài gần như không đổi. Khi thay bằng nước cất nhược trương, nước đi ngược trở vào, khối chất nguyên sinh phồng lên áp sát thành trở lại — phản co nguyên sinh. Điều chỉ hình động nói được: cái co lại là chất nguyên sinh chứ không phải cả tế bào, và hiện tượng đảo ngược được nên tế bào vẫn sống.',
      viewBoxWidth: 440,
      viewBoxHeight: 220,
      durationMs: 10000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'thanh',
          x: 60,
          y: 50,
          w: 320,
          h: 120,
          rx: 10,
          fill: 'surface',
          stroke: 'neutral',
          strokeWidth: 4,
        },
        {
          kind: 'label',
          id: 'l-thanh',
          x: 220,
          y: 38,
          text: 'Thành cellulose (cứng, không đổi hình)',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'rect',
          id: 'nguyen-sinh',
          x: 66,
          y: 56,
          w: 308,
          h: 108,
          rx: 8,
          fill: 'primary',
          opacity: 0.75,
          keyframes: [
            { atMs: 0, scale: 1 },
            { atMs: 1200, scale: 1 },
            { atMs: 4200, scale: 0.62 },
            { atMs: 6000, scale: 0.62 },
            { atMs: 8800, scale: 1 },
            { atMs: 10000, scale: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'nuoc-ra',
          x1: 220,
          y1: 110,
          x2: 400,
          y2: 110,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1200, opacity: 0 },
            { atMs: 1800, opacity: 1 },
            { atMs: 4600, opacity: 1 },
            { atMs: 5200, opacity: 0 },
            { atMs: 10000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'nuoc-vao',
          x1: 400,
          y1: 140,
          x2: 240,
          y2: 140,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6200, opacity: 0 },
            { atMs: 6800, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'l-co',
          x: 220,
          y: 196,
          text: 'Ưu trương: nước ra → co nguyên sinh',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1600, opacity: 0 },
            { atMs: 2200, opacity: 1 },
            { atMs: 5800, opacity: 1 },
            { atMs: 6200, opacity: 0 },
            { atMs: 10000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'l-phan-co',
          x: 220,
          y: 196,
          text: 'Nhược trương: nước vào → phản co nguyên sinh',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6400, opacity: 0 },
            { atMs: 7000, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 600, text: 'Ban đầu chất nguyên sinh áp sát thành tế bào.' },
        { atMs: 2200, text: 'Nhỏ dung dịch muối ưu trương: nước thẩm thấu ra ngoài.' },
        {
          atMs: 4200,
          text: 'Chất nguyên sinh teo lại, tách khỏi thành — co nguyên sinh. Thành vẫn giữ nguyên hình.',
        },
        { atMs: 7000, text: 'Thay bằng nước cất nhược trương: nước đi ngược vào tế bào.' },
        {
          atMs: 8800,
          text: 'Chất nguyên sinh phồng lại áp sát thành — phản co nguyên sinh, chứng tỏ tế bào còn sống.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Trao đổi chất qua màng và truyền tin tế bào',
    lessonNumber: 11,
    title: 'Thực hành: Thí nghiệm co và phản co nguyên sinh',
    hook: 'Trong bài thực hành này, chúng ta sẽ thực sự quan sát bằng mắt qua kính hiển vi tế bào biểu bì hành tây co lại và phục hồi khi thay đổi môi trường lỏng.',
    theory:
      '## Thiết kế thí nghiệm co và phản co nguyên sinh\n' +
      '1. Quan sát tế bào bình thường: Bóc biểu bì hành tây màu tím (chứa sắc tố anthocyanin nên dễ quan sát), làm tiêu bản với nước cất và quan sát hình dạng tế bào.\n' +
      '2. Gây co nguyên sinh:\n' +
      '   — Nhỏ dung dịch muối ưu trương (NaCl 10%) vào rìa lamela.\n' +
      '   — Dùng giấy thấm kéo dung dịch vào.\n' +
      '   — Quan sát tế bào sau khoảng 5-10 phút: Không bào co lại, nguyên sinh chất (bao gồm màng sinh chất và tế bào chất) co rút và tách khỏi thành tế bào (plasmolysis).\n' +
      '3. Gây phản co nguyên sinh:\n' +
      '   — Sau khi quan sát co nguyên sinh, nhỏ nước cất vào rìa lamela, hút dung dịch ưu trương ra.\n' +
      '   — Quan sát sau 5-10 phút: Nguyên sinh chất phình trở lại và tiếp xúc với thành tế bào (phản co nguyên sinh).',
    workedExample: {
      problem:
        'Giải thích kết quả quan sát thấy khi nhỏ nước cất vào tiêu bản đang ở trạng thái co nguyên sinh.',
      steps: [
        'Trạng thái ban đầu: Tế bào đang ở trạng thái co nguyên sinh do nồng độ chất tan bên trong tế bào cao hơn môi trường nước cất.',
        'Nguyên lí thẩm thấu: Nước từ môi trường nhược trương (nước cất) thấm qua màng bán thấm vào bên trong tế bào.',
        'Kết quả quan sát: Không bào của tế bào dần dần phình to trở lại, đẩy màng sinh chất về phía thành tế bào. Tế bào trở lại trạng thái bình thường.',
      ],
      answer:
        'Nước thấm vào tế bào theo thẩm thấu, từ môi trường nhược trương bên ngoài vào phần ưu trương bên trong, làm không bào phình to nên tế bào hồi phục.',
    },
    checkQuestions: [
      {
        prompt: 'Trong thí nghiệm co nguyên sinh, bộ phận nào của tế bào thực vật co lại đầu tiên?',
        choices: [
          {
            id: 'co_1',
            label: 'Không bào trung tâm co lại, kéo theo màng sinh chất tách khỏi thành tế bào',
          },
          { id: 'co_2', label: 'Thành tế bào cellulose bị vỡ ra' },
          { id: 'co_3', label: 'Nhân tế bào co lại rồi biến mất' },
          { id: 'co_4', label: 'Màng nhân tan chảy' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['co_1'],
        },
        explain:
          'Nước rời khỏi không bào trung tâm làm không bào co lại, kéo theo màng sinh chất tách khỏi thành tế bào. Thành tế bào không bị co vì nó cứng và không co giãn.',
      },
      {
        prompt:
          'Dung dịch nào nên được sử dụng để gây co nguyên sinh cho tế bào thực vật trong thí nghiệm?',
        choices: [
          { id: 'dd_1', label: 'Dung dịch muối ưu trương (ví dụ NaCl 10%)' },
          { id: 'dd_2', label: 'Nước cất hoặc dung dịch nhược trương' },
          { id: 'dd_3', label: 'Dung dịch đẳng trương tương đương nội bào' },
          { id: 'dd_4', label: 'Dung dịch acid HCl loãng' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dd_1'],
        },
        explain:
          'Cần dung dịch ưu trương (nồng độ chất tan cao hơn bên trong tế bào) để nước di chuyển ra khỏi tế bào gây co nguyên sinh.',
      },
    ],
    srsCards: [
      {
        hoi: 'Co nguyên sinh là gì?',
        dap: 'Hiện tượng màng sinh chất tách khỏi thành tế bào khi tế bào thực vật mất nước trong dung dịch ưu trương.',
      },
      {
        hoi: 'Điều kiện để xảy ra phản co nguyên sinh?',
        dap: 'Đặt tế bào đang co nguyên sinh vào nước cất hoặc dung dịch nhược trương để nước thấm trở lại.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c4-b12',
    animation: {
      title: 'Ba giai đoạn truyền tin tế bào',
      description:
        'Một dải màng sinh chất nằm ngang chia ngoài tế bào (trên) và trong tế bào (dưới). Bên trái là tín hiệu ưa nước: một phân tử tín hiệu tròn trôi xuống và khớp vào hõm của protein thụ thể trên màng (TIẾP NHẬN, chỉ khớp với thụ thể đặc hiệu). Đuôi thụ thể phía trong sáng lên, kích hoạt 1 phân tử, rồi 2, rồi 4: chuỗi phản ứng nội bào vừa truyền vừa khuếch đại tín hiệu (TRUYỀN TIN). Mũi tên cuối đi vào nhân, một gene sáng lên và một sợi mARN đi ra (ĐÁP ỨNG: tế bào đổi hoạt động, ở đây là bật phiên mã). Bên phải là tín hiệu kị nước như hormone steroid: phân tử hình thoi đi thẳng qua lớp lipid của màng, gắn vào thụ thể nằm trong tế bào chất, rồi cả phức hợp đi vào nhân và trực tiếp đổi biểu hiện gene.',
      viewBoxWidth: 600,
      viewBoxHeight: 322,
      durationMs: 13500,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 300,
          y: 22,
          text: 'Tiếp nhận → truyền tin → đáp ứng',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'lb-trai',
          x: 175,
          y: 44,
          text: 'Tín hiệu ưa nước (hormone peptide)',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'lb-phai',
          x: 480,
          y: 44,
          text: 'Tín hiệu kị nước (steroid)',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'chia',
          x1: 372,
          y1: 36,
          x2: 372,
          y2: 316,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '4 3',
        },
        {
          kind: 'rect',
          id: 'mang',
          x: 16,
          y: 92,
          w: 568,
          h: 12,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'mang-giua',
          x1: 16,
          y1: 98,
          x2: 584,
          y2: 98,
          stroke: 'primary',
          strokeWidth: 1,
          dash: '3 3',
        },
        {
          kind: 'label',
          id: 'lb-ngoai',
          x: 20,
          y: 84,
          text: 'ngoài tế bào',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'lb-trong',
          x: 20,
          y: 120,
          text: 'trong tế bào',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'thu-the',
          points: [
            [162, 92],
            [162, 74],
            [168, 74],
            [168, 86],
            [182, 86],
            [182, 74],
            [188, 74],
            [188, 92],
          ],
          stroke: 'neutral',
          strokeWidth: 2.5,
        },
        {
          kind: 'rect',
          id: 'duoi',
          x: 169,
          y: 104,
          w: 12,
          h: 16,
          fill: 'muted',
        },
        {
          kind: 'rect',
          id: 'duoi-bat',
          x: 169,
          y: 104,
          w: 12,
          h: 16,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 0,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'tin-hieu',
          cx: 175,
          cy: 79,
          r: 6,
          fill: 'danger',
          keyframes: [
            {
              atMs: 0,
              dx: -90,
              dy: -22,
            },
            {
              atMs: 2000,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-1',
          x: 230,
          y: 62,
          text: '1. Tiếp nhận',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 300,
              opacity: 0,
            },
            {
              atMs: 600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-1b',
          x: 230,
          y: 76,
          text: 'khớp đúng thụ thể',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 300,
              opacity: 0,
            },
            {
              atMs: 600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'a0',
          x1: 175,
          y1: 121,
          x2: 175,
          y2: 132,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'h1',
          cx: 175,
          cy: 140,
          r: 6,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 3000,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 3400,
              scale: 1,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'a1',
          x1: 169,
          y1: 146,
          x2: 149,
          y2: 164,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3600,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'a2',
          x1: 181,
          y1: 146,
          x2: 201,
          y2: 164,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3600,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'h2',
          cx: 145,
          cy: 172,
          r: 6,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 3700,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4100,
              scale: 1,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'h3',
          cx: 205,
          cy: 172,
          r: 6,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 3700,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4100,
              scale: 1,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'a3',
          x1: 141,
          y1: 178,
          x2: 125,
          y2: 194,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4300,
              opacity: 0,
            },
            {
              atMs: 4600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'a4',
          x1: 149,
          y1: 178,
          x2: 157,
          y2: 194,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4300,
              opacity: 0,
            },
            {
              atMs: 4600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'a5',
          x1: 201,
          y1: 178,
          x2: 193,
          y2: 194,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4300,
              opacity: 0,
            },
            {
              atMs: 4600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'a6',
          x1: 209,
          y1: 178,
          x2: 225,
          y2: 194,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4300,
              opacity: 0,
            },
            {
              atMs: 4600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'h4',
          cx: 120,
          cy: 202,
          r: 6,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4400,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4800,
              scale: 1,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'h5',
          cx: 160,
          cy: 202,
          r: 6,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4400,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4800,
              scale: 1,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'h6',
          cx: 190,
          cy: 202,
          r: 6,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4400,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4800,
              scale: 1,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'h7',
          cx: 230,
          cy: 202,
          r: 6,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4400,
              scale: 0.4,
              opacity: 0,
            },
            {
              atMs: 4800,
              scale: 1,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-2',
          x: 262,
          y: 150,
          text: '2. Truyền tin',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 0,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-2b',
          x: 262,
          y: 164,
          text: '1 → 2 → 4: khuếch đại',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 0,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'nhan-trai',
          points: [
            [255, 268],
            [252.27, 274.73],
            [244.28, 281],
            [231.57, 286.38],
            [215, 290.52],
            [195.71, 293.11],
            [175, 294],
            [154.29, 293.11],
            [135, 290.52],
            [118.43, 286.38],
            [105.72, 281],
            [97.73, 274.73],
            [95, 268],
            [97.73, 261.27],
            [105.72, 255],
            [118.43, 249.62],
            [135, 245.48],
            [154.29, 242.89],
            [175, 242],
            [195.71, 242.89],
            [215, 245.48],
            [231.57, 249.62],
            [244.28, 255],
            [252.27, 261.27],
          ],
          closed: true,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'arrow',
          id: 'a7',
          x1: 175,
          y1: 210,
          x2: 175,
          y2: 250,
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 5900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'gene-trai',
          x1: 150,
          y1: 272,
          x2: 200,
          y2: 272,
          stroke: 'muted',
          strokeWidth: 4,
        },
        {
          kind: 'line',
          id: 'gene-trai-bat',
          x1: 150,
          y1: 272,
          x2: 200,
          y2: 272,
          stroke: 'correct',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'mrna',
          points: [
            [205, 263],
            [211, 266],
            [217, 257],
            [223, 260],
            [229, 251],
            [235, 254],
            [241, 245],
            [247, 248],
            [253, 239],
          ],
          stroke: 'danger',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6700,
              opacity: 0,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-3',
          x: 262,
          y: 236,
          text: '3. Đáp ứng',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 5900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-nhan-trai',
          x: 175,
          y: 312,
          text: 'nhân: bật phiên mã một gene',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 5900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'nhan-phai',
          points: [
            [560, 268],
            [557.27, 274.73],
            [549.28, 281],
            [536.57, 286.38],
            [520, 290.52],
            [500.71, 293.11],
            [480, 294],
            [459.29, 293.11],
            [440, 290.52],
            [423.43, 286.38],
            [410.72, 281],
            [402.73, 274.73],
            [400, 268],
            [402.73, 261.27],
            [410.72, 255],
            [423.43, 249.62],
            [440, 245.48],
            [459.29, 242.89],
            [480, 242],
            [500.71, 242.89],
            [520, 245.48],
            [536.57, 249.62],
            [549.28, 255],
            [557.27, 261.27],
          ],
          closed: true,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'gene-phai',
          x1: 455,
          y1: 284,
          x2: 505,
          y2: 284,
          stroke: 'muted',
          strokeWidth: 4,
        },
        {
          kind: 'line',
          id: 'gene-phai-bat',
          x1: 455,
          y1: 284,
          x2: 505,
          y2: 284,
          stroke: 'correct',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10500,
              opacity: 0,
            },
            {
              atMs: 10800,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'thu-the-trong',
          points: [
            [466, 152],
            [466, 172],
            [494, 172],
            [494, 152],
          ],
          stroke: 'neutral',
          strokeWidth: 2.5,
          keyframes: [
            {
              atMs: 0,
              dy: 0,
            },
            {
              atMs: 9200,
              dy: 0,
            },
            {
              atMs: 10400,
              dy: 96,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'steroid',
          points: [
            [480, 154],
            [487, 162],
            [480, 170],
            [473, 162],
          ],
          closed: true,
          fill: 'danger',
          keyframes: [
            {
              atMs: 0,
              dx: -45,
              dy: -100,
            },
            {
              atMs: 7400,
              dx: -45,
              dy: -100,
            },
            {
              atMs: 8900,
              dx: 0,
              dy: -6,
            },
            {
              atMs: 9100,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 9200,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 10400,
              dx: 0,
              dy: 96,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-xuyen',
          x: 500,
          y: 124,
          text: 'đi thẳng qua lớp lipid',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8000,
              opacity: 0,
            },
            {
              atMs: 8300,
              opacity: 1,
            },
            {
              atMs: 9200,
              opacity: 1,
            },
            {
              atMs: 9500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-tt-trong',
          x: 502,
          y: 166,
          text: 'thụ thể trong',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 0,
            },
            {
              atMs: 9200,
              opacity: 1,
            },
            {
              atMs: 9200,
              opacity: 1,
            },
            {
              atMs: 9500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-tt-trong-2',
          x: 502,
          y: 179,
          text: 'tế bào chất',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8900,
              opacity: 0,
            },
            {
              atMs: 9200,
              opacity: 1,
            },
            {
              atMs: 9200,
              opacity: 1,
            },
            {
              atMs: 9500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-nhan-phai',
          x: 480,
          y: 312,
          text: 'vào nhân, đổi biểu hiện gene',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 9800,
              opacity: 0,
            },
            {
              atMs: 10100,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Tiếp nhận: phân tử tín hiệu gắn vào thụ thể đặc hiệu trên màng tế bào đích.',
        },
        {
          atMs: 2700,
          text: 'Thụ thể đổi hình, khởi động chuỗi phản ứng nội bào: 1 phân tử kích hoạt 2, rồi 4. Tín hiệu được khuếch đại.',
        },
        {
          atMs: 5600,
          text: 'Đáp ứng: tế bào đổi hoạt động, ví dụ bật phiên mã một gene.',
        },
        {
          atMs: 7400,
          text: 'Tín hiệu kị nước như hormone steroid đi thẳng qua lớp lipid của màng.',
        },
        {
          atMs: 9200,
          text: 'Nó gắn thụ thể trong tế bào chất, rồi cả phức hợp vào nhân, đổi trực tiếp biểu hiện gene.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Trao đổi chất qua màng và truyền tin tế bào',
    lessonNumber: 12,
    title: 'Truyền tin tế bào',
    hook:
      'Khi bạn thấy mối nguy hiểm, trong mili giây não bộ đã truyền tín hiệu đến khắp cơ thể và tuyến thượng thận tiết ra adrenaline để chuẩn bị cho "chiến hay chạy". ' +
      'Tế bào giao tiếp với nhau như thế nào?',
    theory:
      '## Truyền tin tế bào (cell signaling)\n' +
      'Gồm 3 giai đoạn chính:\n' +
      '1. Tiếp nhận (Reception): Phân tử tín hiệu (ligand như hormone, chất dẫn truyền thần kinh) gắn vào protein thụ thể (receptor) đặc hiệu trên màng tế bào đích.\n' +
      '2. Chuyển đổi tín hiệu (Signal transduction): Liên kết của ligand thay đổi hình dạng thụ thể, khởi động một chuỗi phản ứng phân tử (signaling cascade) bên trong tế bào, khuếch đại tín hiệu.\n' +
      '3. Đáp ứng (Response): Cuối cùng dẫn đến sự thay đổi hoạt động của tế bào (thay đổi biểu hiện gene, co rút cơ, tiết hormone, phân bào...).\n\n' +
      '## Các loại tín hiệu phân tử\n' +
      '— Phân tử ưa nước (như phần lớn hormone peptide, adrenaline): Không qua được màng lipid, gắn với thụ thể bề mặt, kích hoạt chuỗi phân tử nội bào.\n' +
      '— Phân tử kị nước (như hormone steroid, NO, hormone tuyến giáp): Khuếch tán qua màng phospholipid, gắn với thụ thể trong tế bào chất hoặc nhân, trực tiếp thay đổi biểu hiện gene.',
    workedExample: {
      problem: 'Mô tả quá trình truyền tín hiệu khi adrenaline gắn vào thụ thể tế bào cơ tim.',
      steps: [
        'Giai đoạn Tiếp nhận: Phân tử adrenaline (ligand) gắn vào thụ thể beta-adrenergic đặc hiệu trên màng tế bào cơ tim.',
        'Giai đoạn Chuyển đổi: Thụ thể thay đổi hình dạng, hoạt hoá G-protein. G-protein hoạt hoá enzyme adenylyl cyclase, enzyme này xúc tác tổng hợp cAMP (second messenger) từ ATP. cAMP khuếch đại tín hiệu bằng cách hoạt hoá protein kinase A.',
        'Giai đoạn Đáp ứng: Protein kinase A phosphoryl hoá các protein điều tiết tim (ví dụ điều tiết kênh calcium), kết quả là tăng lực co và nhịp tim.',
      ],
      answer:
        'Adrenaline gắn thụ thể bề mặt → G-protein → cAMP (second messenger) → kinase A → tăng lực co và nhịp tim.',
    },
    checkQuestions: [
      {
        prompt: 'Trong quá trình truyền tin tế bào, bước nào diễn ra CUỐI CÙNG?',
        choices: [
          { id: 'tt_1', label: 'Đáp ứng của tế bào (Cellular response)' },
          { id: 'tt_2', label: 'Tiếp nhận tín hiệu (Reception)' },
          { id: 'tt_3', label: 'Chuyển đổi tín hiệu (Signal transduction)' },
          { id: 'tt_4', label: 'Giải phóng phân tử tín hiệu' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['tt_1'],
        },
        explain:
          'Ba giai đoạn của truyền tin tế bào luôn đi theo thứ tự: Tiếp nhận -> Chuyển đổi -> Đáp ứng. Đáp ứng đứng cuối vì tế bào chỉ đổi hoạt động sau khi đã nhận được tín hiệu và truyền xong tín hiệu đó vào bên trong.',
      },
      {
        prompt: 'Hormone steroid (ví dụ testosterone) có thể gắn với thụ thể ở đâu và điều hoà gì?',
        choices: [
          {
            id: 'st_1',
            label: 'Gắn với thụ thể trong tế bào chất hoặc nhân, trực tiếp điều hoà biểu hiện gene',
          },
          { id: 'st_2', label: 'Gắn với thụ thể trên màng tế bào, kích hoạt cAMP' },
          { id: 'st_3', label: 'Gắn với thụ thể ngoài tế bào, không vào được tế bào' },
          { id: 'st_4', label: 'Không có thụ thể đặc hiệu, lan toả tự do' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['st_1'],
        },
        explain:
          'Hormone steroid là phân tử kị nước, dễ dàng khuếch tán qua màng sinh chất vào tế bào chất hoặc nhân, gắn với thụ thể ở đó và ảnh hưởng trực tiếp đến biểu hiện gene.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu 3 giai đoạn của quá trình truyền tin tế bào theo đúng thứ tự?',
        dap: 'Tiếp nhận (Reception) -> Chuyển đổi (Signal transduction) -> Đáp ứng (Response).',
      },
      {
        hoi: 'Tại sao phân tử tín hiệu ưa nước không thể tự khuếch tán qua màng tế bào?',
        dap: 'Vì lõi kị nước của lớp kép phospholipid ngăn cản các phân tử phân cực hoặc ion đi qua.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
