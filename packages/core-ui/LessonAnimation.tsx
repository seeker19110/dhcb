// packages/core-ui/LessonAnimation.tsx — Trình vẽ hoạt ảnh minh hoạ bài học, dùng chung
// cho cả 4 môn STEM (Toán · Lí · Hoá · Sinh).
//
// Nhận vào ĐẶC TẢ KHAI BÁO (`LessonAnimation` của @dhcb/core-contracts/lessonAnimation), không
// nhận HTML/SVG tự do — lý do ở đầu file hợp đồng đó. Ba việc file này lo thay cho mọi môn:
//   1. Ánh xạ vai trò màu → token `--a-*` / `--text-*` / `--anim-*`, để đúng ở cả 5 theme.
//   2. Tôn trọng `prefers-reduced-motion`: dừng hẳn hoạt ảnh, hiện cảnh ở mốc 0.
//   3. Luôn kèm mô tả bằng lời + nút phát/dừng — hoạt ảnh không được là kênh thông tin duy nhất.
//   4. Nút "Xem lớn" khi chữ nhãn hiện quá nhỏ ở bề rộng hiện tại (2026-09-25). Hoạt ảnh vẽ
//      trên khung 420–716 đơn vị nên ở màn điện thoại (SVG rộng ~358px) đo được 1.000/1.861 nhãn
//      dưới 10px, tệ nhất 6px. Không sửa tay từng nhãn được; hộp thoại toàn màn hình tự xoay hình
//      khổ ngang theo chiều dài màn hình dựng đứng, nên chữ về lại đúng cỡ kể cả khi khoá xoay.
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type Ref } from 'react'
import { boCucXemLon, chuQuaNho } from './lessonAnimationZoom.js'
import { giaiMoc } from './animationKeyframes.js'
import type {
  AnimationColorRole,
  AnimationKeyframe,
  AnimationShape,
  LessonAnimation as LessonAnimationSpec,
} from '@dhcb/core-contracts/lessonAnimation'

/** Vai trò màu → giá trị CSS. Giữ ở một chỗ để đổi token là đổi toàn bộ hoạt ảnh mọi môn. */
const COLOR_BY_ROLE: Record<AnimationColorRole, string> = {
  primary: 'rgb(var(--a-600))',
  accent: 'rgb(var(--a-400))',
  correct: 'rgb(var(--anim-correct))',
  warn: 'rgb(var(--anim-warn))',
  danger: 'rgb(var(--anim-danger))',
  neutral: 'rgb(var(--text-primary))',
  muted: 'rgb(var(--text-muted))',
  surface: 'rgb(var(--surface-card))',
}

function color(role: AnimationColorRole | undefined, fallback: string): string {
  return role ? COLOR_BY_ROLE[role] : fallback
}

/** Tâm hình — gốc mặc định của phép xoay/phóng khi hình không khai `origin`, để hoạt ảnh không
 *  "trôi" khỏi vị trí. Hình cần gốc khác (đuôi mũi tên, chân cột, điểm treo) thì khai `origin`. */
function centerOf(shape: AnimationShape): { cx: number; cy: number } {
  switch (shape.kind) {
    case 'circle':
      return { cx: shape.cx, cy: shape.cy }
    case 'rect':
      return { cx: shape.x + shape.w / 2, cy: shape.y + shape.h / 2 }
    case 'line':
    case 'arrow':
      return { cx: (shape.x1 + shape.x2) / 2, cy: (shape.y1 + shape.y2) / 2 }
    case 'polyline': {
      const xs = shape.points.map((p) => p[0])
      const ys = shape.points.map((p) => p[1])
      return {
        cx: (Math.min(...xs) + Math.max(...xs)) / 2,
        cy: (Math.min(...ys) + Math.max(...ys)) / 2,
      }
    }
    case 'label':
      return { cx: shape.x, cy: shape.y }
  }
}

/** Làm tròn tích số thực (0,1 × 3 = 0,30000000000000004) để CSS sinh ra đọc được và ổn định. */
function gon(x: number): number {
  return Math.round(x * 10_000) / 10_000
}

/** Dựng @keyframes CSS từ danh sách mốc thời gian. Chỉ sinh transform + opacity —
 *  hai thuộc tính trình duyệt chạy được trên luồng hợp thành, không gây reflow. */
function keyframesCss(
  name: string,
  frames: AnimationKeyframe[],
  durationMs: number,
  center: { cx: number; cy: number },
  opacityTinh: number | undefined,
): string {
  const coOpacity = frames.some((f) => f.opacity !== undefined)
  const steps = giaiMoc(frames, durationMs, opacityTinh).map((m) => {
    const pct = durationMs === 0 ? 0 : (m.atMs / durationMs) * 100
    // Đủ ba hàm ở MỌI mốc để trình duyệt nội suy từng con số. Hai mốc có danh sách hàm khác nhau
    // thì trình duyệt phải nội suy qua ma trận, và phép xoay có thể đi đường tắt ngược chiều.
    const sx = gon(m.scale * m.scaleX)
    const sy = gon(m.scale * m.scaleY)
    const transform = `translate(${m.dx}px, ${m.dy}px) rotate(${m.rotate}deg) scale(${sx}, ${sy})`
    const opacity = coOpacity ? ` opacity: ${m.opacity};` : ''
    return `  ${pct.toFixed(3)}% { transform-origin: ${center.cx}px ${center.cy}px; transform: ${transform};${opacity} }`
  })
  return `@keyframes ${name} {\n${steps.join('\n')}\n}`
}

function Shape({ shape }: { shape: AnimationShape }) {
  const stroke = color(shape.stroke, 'none')
  // Opacity TĨNH của hình nằm trên thẻ con, opacity ĐỘNG (keyframes) chạy trên <g> cha — hai
  // giá trị NHÂN với nhau. 159/238 hoạt ảnh (rà 2026-09-22) viết `opacity: 0` tĩnh + keyframes
  // nâng lên 1 với ý "keyframe quyết định lúc hiện" → nếu giữ opacity tĩnh thì hình vô hình vĩnh
  // viễn (0 × bất kỳ = 0). Vì thế: hình có keyframe điều khiển opacity thì keyframe là nguồn sự
  // thật, bỏ opacity tĩnh; hình chỉ có keyframe vị trí (dx/dy…) vẫn giữ opacity tĩnh làm nền.
  const keyframeDieuKhienOpacity = shape.keyframes?.some((k) => k.opacity !== undefined) ?? false
  const common = {
    stroke,
    strokeWidth: shape.strokeWidth,
    strokeDasharray: shape.dash,
    opacity: keyframeDieuKhienOpacity ? undefined : shape.opacity,
  }

  switch (shape.kind) {
    case 'circle':
      return (
        <circle
          {...common}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={color(shape.fill, 'none')}
        />
      )
    case 'rect':
      return (
        <rect
          {...common}
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.rx}
          fill={color(shape.fill, 'none')}
        />
      )
    case 'line':
      return <line {...common} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} />
    case 'arrow':
      return (
        <line
          {...common}
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          markerEnd={`url(#dhcb-arrowhead-${shape.stroke ?? 'neutral'})`}
        />
      )
    case 'polyline': {
      const points = shape.points.map((p) => `${p[0]},${p[1]}`).join(' ')
      // `closed` PHẢI vẽ bằng <polygon>: <polyline> không bao giờ vẽ cạnh nối điểm cuối về điểm
      // đầu (chỉ phần tô là khép). Bẫy đã mắc thật (rà 2026-09-26): 19 hình khép kín ở cả 4 môn
      // thiếu đúng một cạnh — vòng benzen hở, mạch điện hở, đường chạy vòng sân thiếu cạnh trái.
      return shape.closed ? (
        <polygon {...common} points={points} fill={color(shape.fill, 'none')} />
      ) : (
        <polyline {...common} points={points} fill="none" />
      )
    }
    case 'label':
      return (
        <text
          {...common}
          x={shape.x}
          y={shape.y}
          fontSize={shape.size ?? 14}
          textAnchor={shape.anchor ?? 'start'}
          fill={color(shape.fill, 'rgb(var(--text-primary))')}
          // Viền (halo) cùng màu nền giúp chữ nổi trên đường/hình. Riêng chữ màu `surface` là chữ
          // đặt TRÊN một hình tô màu (nhãn trong điện trở, trong quả cầu): viền cùng màu với chữ chỉ
          // làm nét dính vào nhau ("R = 6 Ω" thành một khối) — bỏ viền.
          stroke={shape.fill === 'surface' ? 'none' : 'rgb(var(--surface-card))'}
          strokeWidth={3}
          strokeDasharray="none"
          paintOrder="stroke fill"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        >
          {shape.text}
        </text>
      )
  }
}

export interface LessonAnimationProps {
  spec: LessonAnimationSpec
  className?: string
}

interface AnimationSvgProps {
  spec: LessonAnimationSpec
  uid: string
  animNames: Map<string, string>
  arrowRoles: AnimationColorRole[]
  descriptionId: string
  svgRef?: Ref<SVGSVGElement>
  style?: CSSProperties
}

/** Thẻ svg của hoạt ảnh — tách riêng để vẽ ĐÚNG MỘT cách ở cả trong bài lẫn khung "Xem lớn".
 *  Cả hai dùng chung lớp `dhcb-anim-${uid}`, nên chung @keyframes và chung trạng thái phát/dừng. */
function AnimationSvg({
  spec,
  uid,
  animNames,
  arrowRoles,
  descriptionId,
  svgRef,
  style,
}: AnimationSvgProps) {
  return (
    <svg
      ref={svgRef}
      className={`dhcb-anim-${uid} w-full h-auto`}
      style={style}
      viewBox={`0 0 ${spec.viewBoxWidth} ${spec.viewBoxHeight}`}
      role="img"
      aria-describedby={descriptionId}
      aria-label={spec.title}
    >
      <defs>
        {arrowRoles.map((role) => (
          <marker
            key={role}
            id={`dhcb-arrowhead-${role}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={COLOR_BY_ROLE[role]} />
          </marker>
        ))}
      </defs>
      {/* Nhãn vẽ sau hình để halo đục không bị đường/hình chuyển động che chữ. */}
      {[
        ...spec.shapes.filter((shape) => shape.kind !== 'label'),
        ...spec.shapes.filter((shape) => shape.kind === 'label'),
      ].map((shape) => {
        const animName = animNames.get(shape.id)
        // `animation-name` PHẢI nằm trên CHÍNH thẻ <g> mang data-animated, vì duration /
        // iteration / play-state được gán cho <g> qua CSS ở trên và CSS animation KHÔNG kế
        // thừa xuống con. Bẫy đã mắc thật (2026-09-22, docs/changelog/0407-*.md): trước đây
        // tên nằm ở hình con → hình con có tên nhưng duration 0s, <g> có duration nhưng không
        // tên → KHÔNG hoạt ảnh nào từng chạy ở cả 4 môn STEM lẫn Lập trình, mà mọi cổng (Zod,
        // snapshot HTML, ảnh chụp cảnh đầu) vẫn xanh vì cảnh đầu vốn đúng.
        return (
          <g
            key={shape.id}
            data-animated={animName ? 'true' : undefined}
            style={animName ? { animationName: animName } : undefined}
          >
            <Shape shape={shape} />
          </g>
        )
      })}
    </svg>
  )
}

interface XemLonProps extends Omit<AnimationSvgProps, 'svgRef' | 'style'> {
  playing: boolean
  onTogglePlay: () => void
  onClose: () => void
}

/**
 * Khung "Xem lớn": `<dialog>` gốc mở bằng `showModal()`. Trình duyệt tự lo bẫy tiêu điểm (phần
 * còn lại của trang thành inert) và Esc để đóng. Tiêu điểm được trả về nút mở ở `onClose` của nơi
 * gọi. Dùng thẻ gốc vì hook hộp thoại của dự án nằm ở `apps/`, mà `packages/` không được import `apps/`.
 */
function XemLon({ spec, playing, onTogglePlay, onClose, ...svg }: XemLonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nutDongRef = useRef<HTMLButtonElement>(null)
  const khungRef = useRef<HTMLDivElement>(null)
  const [khung, setKhung] = useState<{ w: number; h: number } | null>(null)
  const tieuDeId = `dhcb-anim-xem-lon-${svg.uid}`

  useEffect(() => {
    const d = dialogRef.current
    if (d && !d.open && typeof d.showModal === 'function') d.showModal()
    // Tiêu điểm vào nút Đóng: lối ra rõ nhất, và không bấm nhầm được thứ gì khi vừa mở.
    nutDongRef.current?.focus()
    // Khoá cuộn trang nền: Safari iOS vẫn cuộn nền phía sau hộp thoại modal.
    const cu = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = cu
    }
  }, [])

  useEffect(() => {
    const el = khungRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r && r.width > 0 && r.height > 0) setKhung({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const boCuc = khung ? boCucXemLon(spec, khung.w, khung.h) : null
  // Mô tả trong bài nằm NGOÀI dialog, bị inert khi dialog mở, nên khung này mang bản riêng.
  const moTaId = `dhcb-anim-xem-lon-mo-ta-${svg.uid}`

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tieuDeId}
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-surface-card p-0 text-content backdrop:bg-black/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-line-subtle px-3 py-2">
          <h2
            id={tieuDeId}
            className="min-w-0 flex-1 truncate text-base font-semibold text-content"
          >
            {spec.title}
          </h2>
          <button
            type="button"
            onClick={onTogglePlay}
            className="min-h-[44px] shrink-0 rounded-lg border border-line-strong px-3 text-content"
          >
            {playing ? 'Tạm dừng' : 'Chạy'}
          </button>
          <button
            ref={nutDongRef}
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-[44px] shrink-0 rounded-lg border border-line-strong px-3 text-content"
          >
            Đóng
          </button>
        </div>
        {boCuc?.xoay && (
          <p className="px-3 pt-2 text-sm text-content-secondary">
            Xoay ngang điện thoại để đọc hình theo đúng chiều.
          </p>
        )}
        <p id={moTaId} className="sr-only">
          {spec.description}
        </p>
        <div ref={khungRef} className="relative min-h-0 flex-1 overflow-hidden">
          {boCuc && (
            <AnimationSvg
              spec={spec}
              {...svg}
              descriptionId={moTaId}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${boCuc.rongPx}px`,
                transform: `translate(-50%, -50%)${boCuc.xoay ? ' rotate(90deg)' : ''}`,
              }}
            />
          )}
        </div>
      </div>
    </dialog>
  )
}

export function LessonAnimation({ spec, className }: LessonAnimationProps) {
  const rawId = useId()
  // useId sinh chuỗi có dấu ':' — không hợp lệ trong tên @keyframes và id của SVG.
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const [playing, setPlaying] = useState(true)
  const [xemLon, setXemLon] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const nutXemLonRef = useRef<HTMLButtonElement>(null)
  // Bề rộng THẬT của thẻ svg trên màn hình. Đo trong effect (không đo lúc render) nên khi render
  // phía server / lần vẽ đầu, nút "Xem lớn" chưa hiện. Nút nằm cùng hàng nút phát/dừng nên hiện
  // muộn cũng không làm trang nhảy bố cục.
  const [rongSvg, setRongSvg] = useState(0)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setRongSvg(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { css, animNames } = useMemo(() => {
    const names = new Map<string, string>()
    const blocks: string[] = []
    for (const shape of spec.shapes) {
      if (!shape.keyframes || shape.keyframes.length === 0) continue
      const name = `dhcbAnim${uid}${shape.id.replace(/[^a-zA-Z0-9]/g, '')}`
      names.set(shape.id, name)
      // Gốc xoay/co giãn: `origin` nếu hình có khai (đuôi mũi tên, chân cột, điểm treo…), không
      // thì tâm hình như trước — hoạt ảnh cũ không đổi.
      const goc = shape.origin ? { cx: shape.origin[0], cy: shape.origin[1] } : centerOf(shape)
      blocks.push(keyframesCss(name, shape.keyframes, spec.durationMs, goc, shape.opacity))
    }
    return { css: blocks.join('\n'), animNames: names }
  }, [spec, uid])

  // Các vai trò màu thật sự có mũi tên — chỉ sinh marker cần dùng.
  const arrowRoles = useMemo(
    () =>
      Array.from(
        new Set(spec.shapes.filter((s) => s.kind === 'arrow').map((s) => s.stroke ?? 'neutral')),
      ),
    [spec],
  )

  const descriptionId = `dhcb-anim-desc-${uid}`

  return (
    <figure className={className}>
      <style>{`
${css}
.dhcb-anim-${uid} [data-animated='true'] {
  animation-duration: ${spec.durationMs}ms;
  animation-timing-function: linear;
  animation-iteration-count: ${spec.loop ? 'infinite' : '1'};
  animation-fill-mode: both;
  animation-play-state: ${playing ? 'running' : 'paused'};
}
/* Người dùng bật "giảm chuyển động" của hệ điều hành: giữ nguyên cảnh đầu, không chạy.
   Nội dung không mất đi — mô tả bằng lời luôn hiển thị bên dưới. */
@media (prefers-reduced-motion: reduce) {
  .dhcb-anim-${uid} [data-animated='true'] { animation: none !important; }
}
      `}</style>

      <AnimationSvg
        spec={spec}
        uid={uid}
        animNames={animNames}
        arrowRoles={arrowRoles}
        descriptionId={descriptionId}
        svgRef={svgRef}
      />

      <figcaption className="mt-2 space-y-2">
        <p className="font-medium text-content">{spec.title}</p>
        <p id={descriptionId} className="text-content-secondary">
          {spec.description}
        </p>
        {spec.captions && spec.captions.length > 0 && (
          <ol className="list-decimal pl-5 text-content-secondary">
            {spec.captions.map((c) => (
              <li key={c.atMs}>{c.text}</li>
            ))}
          </ol>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="min-h-[44px] rounded-lg border border-line-strong px-4 text-content"
          >
            {playing ? 'Tạm dừng hoạt ảnh' : 'Chạy hoạt ảnh'}
          </button>
          {chuQuaNho(spec, rongSvg) && (
            <button
              ref={nutXemLonRef}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setXemLon(true)}
              className="min-h-[44px] rounded-lg border border-line-strong px-4 text-content"
            >
              Xem lớn
            </button>
          )}
        </div>
      </figcaption>
      {xemLon && (
        <XemLon
          spec={spec}
          uid={uid}
          animNames={animNames}
          arrowRoles={arrowRoles}
          descriptionId={descriptionId}
          playing={playing}
          onTogglePlay={() => setPlaying((p) => !p)}
          onClose={() => {
            setXemLon(false)
            // Trả tiêu điểm về đúng nút đã mở, không để rơi về <body>.
            nutXemLonRef.current?.focus()
          }}
        />
      )}
    </figure>
  )
}
