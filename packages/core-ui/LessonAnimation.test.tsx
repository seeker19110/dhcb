// Cổng cho trình vẽ hoạt ảnh bài học.
//
// Hai thứ đáng canh nhất, vì hỏng thì hỏng lặng lẽ:
//  1. Vai trò màu phải ra biến CSS token — lọt một mã màu thô là mất tương phản ở theme khác.
//  2. Hoạt ảnh luôn phải có kênh thay thế bằng lời; đây là điều khiến nội dung tới được người
//     dùng trình đọc màn hình và người bật "giảm chuyển động".
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { LessonAnimation as Spec } from '@dhcb/core-contracts/lessonAnimation'
import { LessonAnimation } from './LessonAnimation.js'

const spec: Spec = {
  title: 'Rơi tự do',
  description: 'Hai vật khác khối lượng rơi trong ống chân không và chạm đáy cùng lúc.',
  viewBoxWidth: 200,
  viewBoxHeight: 100,
  durationMs: 2000,
  loop: true,
  shapes: [
    {
      kind: 'circle',
      id: 'bi',
      cx: 20,
      cy: 10,
      r: 5,
      fill: 'accent',
      keyframes: [
        { atMs: 0, dy: 0 },
        { atMs: 2000, dy: 60, opacity: 0.8 },
      ],
    },
    { kind: 'rect', id: 'ong', x: 5, y: 5, w: 40, h: 80, stroke: 'neutral', strokeWidth: 2 },
    { kind: 'line', id: 'day', x1: 5, y1: 85, x2: 45, y2: 85, stroke: 'muted', dash: '4 2' },
    { kind: 'arrow', id: 'luc', x1: 20, y1: 20, x2: 20, y2: 50, stroke: 'correct' },
    {
      kind: 'polyline',
      id: 'do-thi',
      points: [
        [60, 80],
        [80, 60],
        [100, 20],
      ],
      stroke: 'primary',
    },
    { kind: 'label', id: 'nhan', x: 60, y: 95, text: 'thời gian', fill: 'neutral' },
  ],
  captions: [{ atMs: 0, text: 'Thả đồng thời hai vật.' }],
}

function html(): string {
  return renderToStaticMarkup(<LessonAnimation spec={spec} />)
}

describe('LessonAnimation', () => {
  it('vẽ đủ mọi loại hình được khai báo', () => {
    const h = html()
    for (const the of ['<circle', '<rect', '<line', '<polyline', '<text']) {
      expect(h, `thiếu thẻ ${the}`).toContain(the)
    }
  })

  it('màu lấy từ biến CSS token, KHÔNG có mã màu thô', () => {
    const h = html()
    expect(h).toContain('rgb(var(--a-400))')
    expect(h).toContain('rgb(var(--anim-correct))')
    // Mã hex trong thuộc tính màu là dấu hiệu ai đó lách token — trừ hex nằm trong nội dung chữ.
    expect(/(?:fill|stroke)="#[0-9a-f]{3,8}"/i.test(h)).toBe(false)
  })

  it('luôn có mô tả bằng lời và được thẻ svg trỏ tới bằng aria-describedby', () => {
    const h = html()
    expect(h).toContain(spec.description)
    const id = /aria-describedby="([^"]+)"/.exec(h)?.[1]
    expect(id, 'svg thiếu aria-describedby').toBeTruthy()
    expect(h).toContain(`id="${id}"`)
  })

  it('tôn trọng prefers-reduced-motion — có nhánh tắt hẳn hoạt ảnh', () => {
    expect(html()).toContain('prefers-reduced-motion')
  })

  it('có nút tạm dừng để người học dừng chuyển động', () => {
    expect(html()).toContain('Tạm dừng hoạt ảnh')
  })

  it('sinh @keyframes cho hình CÓ mốc thời gian và chỉ hình đó', () => {
    const h = html()
    expect(h).toContain('@keyframes')
    // Hình 'bi' có keyframes nên được đánh dấu chạy; 'ong' không có thì không.
    expect((h.match(/data-animated="true"/g) ?? []).length).toBe(1)
  })

  // Bẫy đã mắc thật (2026-09-22): tên @keyframes từng nằm ở hình CON, còn duration/play-state
  // nằm ở <g> CHA → không hoạt ảnh nào chạy ở cả 5 môn mà mọi cổng vẫn xanh. CSS animation không
  // kế thừa, nên đủ bộ thuộc tính phải nằm trên MỘT phần tử: đúng thẻ mang data-animated.
  it('animation-name nằm trên CHÍNH thẻ mang data-animated (không phải hình con)', () => {
    const h = html()
    const g = /<g data-animated="true"[^>]*>/.exec(h)?.[0]
    expect(g, 'không thấy thẻ g data-animated').toBeTruthy()
    expect(g).toMatch(/style="animation-name:\s*dhcbAnim/)
    // Không hình con nào mang animation-name — hai nơi cùng khai là lại lệch nhau về sau.
    expect(h.match(/animation-name:\s*dhcbAnim/g)?.length).toBe(1)
  })

  // Bẫy thứ hai cùng ngày: opacity TĨNH ở hình con NHÂN với opacity ĐỘNG ở <g> cha. 159/238
  // hoạt ảnh viết `opacity: 0` tĩnh + keyframes nâng lên 1 → vô hình vĩnh viễn. Keyframe phải
  // là nguồn sự thật khi nó điều khiển opacity; hình chỉ animate vị trí vẫn giữ opacity tĩnh.
  it('keyframe điều khiển opacity thì KHÔNG in opacity tĩnh lên hình con', () => {
    const an: Spec = {
      ...spec,
      shapes: [
        {
          kind: 'circle',
          id: 'hien-muon',
          cx: 10,
          cy: 10,
          r: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0 },
            { atMs: 1500, opacity: 1 },
            { atMs: 2000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'mo-di-chuyen',
          cx: 30,
          cy: 10,
          r: 3,
          opacity: 0.4,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2000, dx: 50 },
          ],
        },
      ],
    }
    const h = renderToStaticMarkup(<LessonAnimation spec={an} />)
    const hienMuon = /<circle[^>]*cx="10"[^>]*>/.exec(h)![0]
    expect(hienMuon).not.toMatch(/opacity="0"/)
    const moDiChuyen = /<circle[^>]*cx="30"[^>]*>/.exec(h)![0]
    expect(moDiChuyen).toMatch(/opacity="0.4"/)
  })

  // Bẫy 2026-09-26: CSS tự lấy trạng thái nền cho 0%/100% còn thiếu và bỏ qua mốc thiếu opacity.
  // Luật đọc mốc nằm ở animationKeyframes.ts; ca này canh bộ vẽ thật sự in đủ mọi mốc ra CSS.
  it('CSS in đủ mọi thuộc tính ở mọi mốc, kể cả 0% và 100% mà người soạn không khai', () => {
    const an: Spec = {
      ...spec,
      shapes: [
        {
          kind: 'circle',
          id: 'hien-tre',
          cx: 10,
          cy: 10,
          r: 3,
          keyframes: [
            { atMs: 500, opacity: 0 },
            { atMs: 1000, dx: 40, opacity: 1 },
            { atMs: 1500, rotate: 90 },
          ],
        },
      ],
    }
    const h = renderToStaticMarkup(<LessonAnimation spec={an} />)
    const khoi = /@keyframes dhcbAnim[^{]*hientre \{([^]*?)\n\}/.exec(h)?.[1] ?? ''
    const buoc = khoi.split('\n').filter((d) => d.includes('%'))
    expect(buoc.map((d) => d.trim().split(' ')[0])).toEqual([
      '0.000%',
      '25.000%',
      '50.000%',
      '75.000%',
      '100.000%',
    ])
    // Trước mốc đầu: đứng ẩn ở chỗ cũ. Mốc 75%: giữ dx = 40 và opacity 1 của mốc trước.
    expect(buoc[0]).toContain('translate(0px, 0px) rotate(0deg) scale(1, 1); opacity: 0;')
    expect(buoc[3]).toContain('translate(40px, 0px) rotate(90deg) scale(1, 1); opacity: 1;')
    expect(buoc[4]).toContain('translate(40px, 0px) rotate(90deg) scale(1, 1); opacity: 1;')
  })

  it('scaleX/scaleY co giãn một trục quanh `origin`, nhân thêm vào `scale`', () => {
    const an: Spec = {
      ...spec,
      shapes: [
        {
          kind: 'rect',
          id: 'cot-dang',
          x: 10,
          y: 20,
          w: 8,
          h: 60,
          origin: [14, 80],
          keyframes: [
            { atMs: 0, scaleY: 0.01 },
            { atMs: 2000, scaleY: 1, scale: 0.5 },
          ],
        },
      ],
    }
    const h = renderToStaticMarkup(<LessonAnimation spec={an} />)
    // Chân cột (14, 80) đứng yên, cột chỉ dâng theo chiều dọc.
    expect(h).toMatch(/cotdang[^}]*transform-origin: 14px 80px[^}]*scale\(1, 0\.01\)/)
    expect(h).toContain('scale(0.5, 0.5)')
  })

  it('mốc thời gian đổi thành phần trăm đúng theo durationMs', () => {
    const h = html()
    expect(h).toContain('0.000%')
    expect(h).toContain('100.000%')
  })

  it('chỉ sinh đầu mũi tên cho vai trò màu thật sự có dùng', () => {
    const h = html()
    expect(h).toContain('dhcb-arrowhead-correct')
    expect(h).not.toContain('dhcb-arrowhead-primary')
  })

  it('in lời dẫn theo thời gian thành danh sách đọc được', () => {
    expect(html()).toContain('Thả đồng thời hai vật.')
  })

  it('co giãn/xoay quanh `origin` nếu hình có khai, không thì quanh tâm hình (như cũ)', () => {
    const coGoc: Spec = {
      ...spec,
      shapes: [
        {
          kind: 'arrow',
          id: 'luc-can',
          x1: 50,
          y1: 80,
          x2: 50,
          y2: 20,
          origin: [50, 80],
          keyframes: [
            { atMs: 0, scale: 0.2 },
            { atMs: 2000, scale: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'khong-goc',
          x1: 100,
          y1: 80,
          x2: 100,
          y2: 20,
          keyframes: [
            { atMs: 0, scale: 0.2 },
            { atMs: 2000, scale: 1 },
          ],
        },
      ],
    }
    const h = renderToStaticMarkup(<LessonAnimation spec={coGoc} />)
    // Đuôi mũi tên đứng yên khi mũi tên dài ra → gốc ở (50, 80), không phải tâm (50, 50).
    expect(h).toMatch(/luccan[^}]*transform-origin: 50px 80px/)
    expect(h).toMatch(/khonggoc[^}]*transform-origin: 100px 50px/)
  })

  it('đường khép kín (`closed`) vẽ bằng <polygon> để có cả cạnh cuối → đầu', () => {
    // <polyline> không bao giờ vẽ cạnh nối điểm cuối về điểm đầu: vòng benzen từng hở một cạnh.
    const khep: Spec = {
      ...spec,
      shapes: [
        {
          kind: 'polyline',
          id: 'luc-giac',
          points: [
            [10, 0],
            [20, 5],
            [20, 15],
            [10, 20],
            [0, 15],
            [0, 5],
          ],
          closed: true,
          stroke: 'primary',
        },
        {
          kind: 'polyline',
          id: 'do-thi',
          points: [
            [0, 0],
            [10, 10],
          ],
          stroke: 'primary',
        },
      ],
    }
    const h = renderToStaticMarkup(<LessonAnimation spec={khep} />)
    expect(h).toContain('<polygon')
    expect(h).toContain('points="10,0 20,5 20,15 10,20 0,15 0,5"')
    // Đường hở (đồ thị) vẫn là polyline, không bị tô.
    expect(h).toMatch(/<polyline[^>]*points="0,0 10,10"[^>]*fill="none"/)
    expect(h.match(/<polygon/g)).toHaveLength(1)
  })

  it('chữ màu `surface` (đặt trên hình tô màu) không có viền; chữ thường vẫn có viền nền', () => {
    const chu: Spec = {
      ...spec,
      shapes: [
        { kind: 'rect', id: 'dien-tro', x: 0, y: 0, w: 60, h: 30, fill: 'accent' },
        { kind: 'label', id: 'trong', x: 30, y: 20, text: 'R = 6 Ω', fill: 'surface' },
        { kind: 'label', id: 'ngoai', x: 30, y: 60, text: 'toả nhiệt', fill: 'muted' },
      ],
    }
    const h = renderToStaticMarkup(<LessonAnimation spec={chu} />)
    expect(h).toMatch(/<text[^>]*stroke="none"[^>]*>R = 6 Ω<\/text>/)
    expect(h).toMatch(/<text[^>]*stroke="rgb\(var\(--surface-card\)\)"[^>]*>toả nhiệt<\/text>/)
  })

  it('hoạt ảnh không lặp thì khai iteration-count là 1', () => {
    const h = renderToStaticMarkup(<LessonAnimation spec={{ ...spec, loop: false }} />)
    expect(h).toContain('animation-iteration-count: 1')
  })
})

// ── Nút "Xem lớn" (2026-09-25) ────────────────────────────────────────────────────────────
// ResizeObserver giả trả số đo thật: svg trong bài rộng `rongSvgGia`; khung hộp thoại 390 × 780
// (điện thoại dựng đứng, trừ thanh tiêu đề).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let rongSvgGia = 358
class ResizeObserverGia {
  constructor(private readonly cb: ResizeObserverCallback) {}
  observe(el: Element) {
    const r =
      el.tagName.toLowerCase() === 'svg'
        ? { width: rongSvgGia, height: 60 }
        : { width: 390, height: 780 }
    this.cb(
      [{ contentRect: r } as unknown as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    )
  }
  unobserve() {}
  disconnect() {}
}

const hinhRong: Spec = {
  ...spec,
  title: 'Các phân tử sinh học',
  viewBoxWidth: 716,
  viewBoxHeight: 118,
  shapes: [
    { kind: 'rect', id: 'nen', x: 0, y: 0, w: 700, h: 100 },
    { kind: 'label', id: 'nhan', x: 10, y: 50, text: 'protein', size: 12 },
  ],
}

let container: HTMLDivElement
let root: Root | null = null

async function veVao(s: Spec) {
  vi.stubGlobal('ResizeObserver', ResizeObserverGia)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(<LessonAnimation spec={s} />)
  })
}

function nut(ten: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === ten)
}

afterEach(() => {
  if (root) act(() => root?.unmount())
  root = null
  container?.remove()
  vi.unstubAllGlobals()
  rongSvgGia = 358
})

describe('LessonAnimation — nút "Xem lớn"', () => {
  it('chữ hiện dưới 10px (716 đơn vị trên svg 358px) → có nút, báo mở hộp thoại', async () => {
    await veVao(hinhRong)
    expect(nut('Xem lớn')?.getAttribute('aria-haspopup')).toBe('dialog')
  })

  it('chữ đủ lớn (svg 800px) → KHÔNG có nút', async () => {
    rongSvgGia = 800
    await veVao(hinhRong)
    expect(nut('Xem lớn')).toBeUndefined()
  })

  it('mở: hộp thoại có tiêu đề, tiêu điểm vào "Đóng", hình khổ ngang được xoay cho vừa chiều dài', async () => {
    await veVao(hinhRong)
    await act(async () => nut('Xem lớn')?.click())
    const dialog = document.querySelector('dialog')
    expect(dialog?.open).toBe(true)
    const tieuDe = document.getElementById(dialog?.getAttribute('aria-labelledby') ?? '')
    expect(tieuDe?.textContent).toBe('Các phân tử sinh học')
    expect(document.activeElement).toBe(nut('Đóng'))
    const svgLon = dialog?.querySelector('svg')
    expect(svgLon?.style.transform).toContain('rotate(90deg)')
    expect(svgLon?.style.width).toBe('780px')
    // Mô tả cho trình đọc màn hình nằm TRONG hộp thoại (mô tả trong bài bị inert khi mở).
    const moTa = document.getElementById(svgLon?.getAttribute('aria-describedby') ?? '')
    expect(dialog?.contains(moTa)).toBe(true)
  })

  it('đóng: hộp thoại gỡ khỏi trang, tiêu điểm trở về nút "Xem lớn"', async () => {
    await veVao(hinhRong)
    await act(async () => nut('Xem lớn')?.click())
    await act(async () => nut('Đóng')?.click())
    expect(document.querySelector('dialog')).toBeNull()
    expect(document.activeElement).toBe(nut('Xem lớn'))
  })
})
