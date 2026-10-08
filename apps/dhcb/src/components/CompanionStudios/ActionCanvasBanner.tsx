import { NavigateFunction } from 'react-router-dom'
import { LayoutGrid, ChevronRight } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'

interface ActionCanvasBannerProps {
  navigate: NavigateFunction
}

/**
 * Lối vào Action Canvas (`/action-canvas`) từ Bạn Đồng Hành. Dời từ studio "Tổng kết" đã gỡ
 * (changelog 0475) sang studio "Kế hoạch" — đây là lối vào DUY NHẤT của trang này trên giao diện.
 */
export default function ActionCanvasBanner({ navigate }: ActionCanvasBannerProps) {
  return (
    // [S06c] nền token `surface-card` thay gradient màu cố (`via-slate-900` KHÔNG đảo theo theme,
    // còn chữ `zinc-100` thì đảo → chữ tối trên nền tối ở blue-sky; axe chỉ báo `incomplete` với
    // gradient nên cổng AA không bắt được).
    // Màn hẹp: xếp dọc, nút rộng hết dòng (khuôn S06d-b). Ở studio cũ banner đặt tiêu đề + nút
    // chung một hàng nên tiêu đề vỡ thành 5 dòng ở 390px (đo bằng ảnh chụp, changelog 0475).
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl border border-cyan-500/30 bg-surface-card shadow-xl">
      <div className="flex items-center gap-3.5">
        <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 theme-light:text-cyan-800 border border-cyan-500/30">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-content flex flex-wrap items-center gap-x-2 gap-y-1">
            Không Gian Làm Việc Trực Quan (Action Canvas)
            <span className="rounded-full px-2 py-0.5 text-[0.6875rem] font-bold uppercase bg-cyan-500/15 text-cyan-200 theme-light:text-cyan-900 border border-cyan-500/40">
              V4.2 Hub
            </span>
          </h4>
          <p className="text-xs text-content-secondary mt-0.5">
            Phác thảo sơ đồ tư duy, chia mục tiêu thành việc học và việc cần làm, kéo thả trực quan.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/action-canvas')}
        className={buttonClass({ variant: 'primary', className: 'w-full sm:w-auto shrink-0' })}
      >
        <span>Mở Workspace</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
