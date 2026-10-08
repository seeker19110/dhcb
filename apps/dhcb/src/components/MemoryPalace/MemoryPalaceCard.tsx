import { useState, useEffect } from 'react'
import MemoryPalaceExplorerModal from './MemoryPalaceExplorerModal.js'
import { fetchMemoryPalaceState } from '../../lib/memoryPalaceApi.js'
import type { MemoryPalaceState } from '@dhcb/core-contracts/memoryPalace'
import { buttonClass } from '@core/buttonStyles'

export default function MemoryPalaceCard() {
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [state, setState] = useState<MemoryPalaceState | null>(null)

  useEffect(() => {
    fetchMemoryPalaceState()
      .then((s) => setState(s))
      .catch(() => {})
  }, [])

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-surface-card p-5 shadow-xl transition duration-300 hover:border-amber-500/50 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/30 border border-amber-400/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 theme-light:text-amber-900 border border-amber-500/30">
                  Ghi nhớ bằng không gian
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Cung Điện Trí Nhớ Không Gian (Memory Palace)
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 leading-relaxed">
                Khám phá các phòng trí nhớ 3D/Isometric, gắn kết từ vựng C1/C2 & công thức STEM vào
                các điểm neo giác quan.
              </p>
              {state && (
                <div className="flex items-center gap-3 mt-2 text-xs text-amber-300 theme-light:text-amber-900/90 font-medium">
                  <span>
                    🏛️ Phòng Loci:{' '}
                    <strong className="text-white">{state.rooms.length} phòng</strong>
                  </span>
                  <span>•</span>
                  <span>
                    🧠 Độ bền ghi nhớ:{' '}
                    <strong className="text-white">{state.overallRetentionIndex}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ⭐ Đã thuần thục:{' '}
                    <strong className="text-white">{state.totalMasteredAnchors} điểm neo</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className={buttonClass({
              variant: 'secondary',
              className: 'w-full sm:w-auto shrink-0',
            })}
          >
            <span>Khám phá Cung Điện</span>
            <span>🗝️</span>
          </button>
        </div>
      </div>

      {isOpenModal && (
        <MemoryPalaceExplorerModal
          onClose={() => {
            setIsOpenModal(false)
            fetchMemoryPalaceState()
              .then((s) => setState(s))
              .catch(() => {})
          }}
        />
      )}
    </>
  )
}
