// apps/dhcb/src/components/PvPArena/PvPArenaCard.tsx — Thẻ hiển thị Đấu Trường 1v1 PvP.
import { useState } from 'react'
import { Swords } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'
import { FEATURE_DESC_CLASS, FEATURE_TITLE_CLASS } from '@core/cardStyles'
import PvPArenaLobbyModal from './PvPArenaLobbyModal.js'

export default function PvPArenaCard() {
  const [isOpenModal, setIsOpenModal] = useState(false)

  return (
    <>
      {/* [S06b, 2026-09-24] Chữ đọc và nút nằm trên nền token ĐẶC (`bg-surface-card`, nút
          `buttonClass`) thay cho gradient — axe không xác định được màu nền gradient nên cổng
          AAA không đo được 7:1. Gradient amber→orange chỉ còn là dải trang trí ở mép trên. */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-surface-card p-4 sm:p-5 shadow-lg transition-colors duration-300 hover:border-amber-500/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 theme-light:text-amber-900 border border-amber-500/30 tracking-wide uppercase">
                  Đấu 1v1
                </span>
                <span className="text-[0.6875rem] font-semibold text-content-secondary">
                  Xếp hạng theo điểm
                </span>
              </div>
              <h3 className={`mt-1 ${FEATURE_TITLE_CLASS}`}>
                Đấu trường 1v1: từ vựng nhanh & bắt lỗi ngữ pháp
              </h3>
              <p className={FEATURE_DESC_CLASS}>
                Đấu với đối thủ AI: phản xạ từ vựng 5s, bắt lỗi ngữ pháp cấp tốc, tích lũy điểm xếp
                hạng và leo Bảng xếp hạng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            // [0500, audit M17] Nút PHỤ: ở trang Luyện tập thẻ này đứng ngay dưới Sổ tay lỗi (nút
            // chính) — hai nút chính cam + đỏ cạnh nhau làm mắt mất điểm neo. Biến thể `secondary`
            // vẫn mang màu thương hiệu, cùng một hình ở mọi trang có thẻ này.
            className={buttonClass({
              variant: 'secondary',
              className: 'w-full sm:w-auto shrink-0',
            })}
          >
            <Swords className="w-4 h-4" />
            <span>Vào đấu trường</span>
          </button>
        </div>
      </div>

      {isOpenModal && <PvPArenaLobbyModal onClose={() => setIsOpenModal(false)} />}
    </>
  )
}
