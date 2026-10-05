// apps/dhcb/src/components/PvPArena/PvPArenaCard.tsx — Thẻ hiển thị Đấu Trường 1v1 PvP.
import { useState } from 'react'
import { Swords } from 'lucide-react'
import PvPArenaLobbyModal from './PvPArenaLobbyModal.js'

export default function PvPArenaCard() {
  const [isOpenModal, setIsOpenModal] = useState(false)

  return (
    <>
      {/* [S06b, 2026-09-24] Chữ đọc và nút nằm trên nền token ĐẶC (`bg-surface-card`, nút
          `bg-amber-500`) thay cho gradient — axe không xác định được màu nền gradient nên cổng
          AAA không đo được 7:1. Gradient amber→orange chỉ còn là dải trang trí ở mép trên. */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-surface-card p-5 shadow-xl transition-all duration-300 hover:border-amber-500/60 mb-6">
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
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 theme-light:text-amber-900 border border-amber-500/30 tracking-wide uppercase">
                  Đấu 1v1
                </span>
                <span className="text-[11px] font-semibold text-content-secondary">
                  Xếp hạng theo điểm
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-content mt-1">
                Đấu trường 1v1: từ vựng nhanh & bắt lỗi ngữ pháp
              </h3>
              <p className="text-xs sm:text-sm text-content-secondary mt-0.5 leading-relaxed">
                Đấu với đối thủ AI: phản xạ từ vựng 5s, bắt lỗi ngữ pháp cấp tốc, tích lũy điểm Elo
                và leo Bảng xếp hạng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="tap-44 w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
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
