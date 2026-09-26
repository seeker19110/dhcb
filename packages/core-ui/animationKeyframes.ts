// animationKeyframes.ts — Giải danh sách mốc thời gian của một hình thành trạng thái ĐẦY ĐỦ ở
// từng mốc, trước khi bộ vẽ `LessonAnimation.tsx` đổi sang @keyframes CSS. Tách riêng khỏi file
// component vì là hàm thuần (dễ test) và vì file component chỉ nên export component.
import type { AnimationKeyframe } from '@dhcb/core-contracts/lessonAnimation'

/** Trạng thái ĐẦY ĐỦ của một hình tại một mốc: thuộc tính nào cũng có giá trị cụ thể. */
export interface TrangThaiMoc {
  atMs: number
  dx: number
  dy: number
  rotate: number
  scale: number
  scaleX: number
  scaleY: number
  opacity: number
}

/** Giải danh sách mốc thành trạng thái đầy đủ, theo đúng cách người soạn hoạt ảnh nghĩ:
 *  - thuộc tính KHÔNG khai ở một mốc thì GIỮ giá trị của mốc trước;
 *  - trước mốc đầu giữ trạng thái mốc đầu, sau mốc cuối giữ trạng thái mốc cuối;
 *  - opacity khởi đầu là opacity tĩnh của hình (mặc định 1).
 *  Để CSS tự lo thì sai ở cả ba chỗ. Mốc thiếu dx/dy từng bị điền `translate(0, 0)` nên hình trượt
 *  về chỗ cũ. CSS bỏ qua mốc thiếu opacity khi nội suy nên hình "tới nơi mới mờ" lại mờ dần suốt
 *  quãng đường. 0%/100% còn thiếu thì CSS lấy trạng thái nền, nên hình "ẩn tới giây 3" hiện ngay từ
 *  đầu và chấm đồ thị trượt thẳng về điểm đầu ở cuối vòng. Bẫy đã mắc thật (rà 2026-09-26, TRAPS.md
 *  mục 10): 40 hoạt ảnh — 4 bài Lí, 6 bài Hoá, 26 bài Sinh, 4 module Lập trình. */
export function giaiMoc(
  frames: readonly AnimationKeyframe[],
  durationMs: number,
  opacityTinh: number | undefined,
): TrangThaiMoc[] {
  const sorted = [...frames].sort((a, b) => a.atMs - b.atMs)
  let truoc: Omit<TrangThaiMoc, 'atMs'> = {
    dx: 0,
    dy: 0,
    rotate: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    opacity: opacityTinh ?? 1,
  }
  const moc = sorted.map((f) => {
    truoc = {
      dx: f.dx ?? truoc.dx,
      dy: f.dy ?? truoc.dy,
      rotate: f.rotate ?? truoc.rotate,
      scale: f.scale ?? truoc.scale,
      scaleX: f.scaleX ?? truoc.scaleX,
      scaleY: f.scaleY ?? truoc.scaleY,
      opacity: f.opacity ?? truoc.opacity,
    }
    return { atMs: f.atMs, ...truoc }
  })
  const dau = moc[0]
  const cuoi = moc[moc.length - 1]
  if (!dau || !cuoi) return moc
  return [
    ...(dau.atMs > 0 ? [{ ...dau, atMs: 0 }] : []),
    ...moc,
    ...(cuoi.atMs < durationMs ? [{ ...cuoi, atMs: durationMs }] : []),
  ]
}
