import { useState } from 'react'
import StemScratchpadModal from './StemScratchpadModal.js'

export default function StemScratchpadCard() {
  const [isOpenModal, setIsOpenModal] = useState(false)

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-surface-card p-5 shadow-xl transition duration-300 hover:border-teal-500/50 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/30 border border-teal-400/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              📐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 theme-light:text-teal-900 border border-teal-500/30 tracking-wide uppercase">
                  STEM Interactive Logic
                </span>
                <span className="text-[0.6875rem] font-semibold text-zinc-400">
                  Step-by-Step Validator
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Bảng Nháp & Kiểm Thử STEM (Toán - Lý - Hóa)
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-0.5 leading-relaxed">
                Viết từng bước biến đổi đại số / phương trình hóa học, AI kiểm tra tính hợp lệ tức
                thời và đưa ra Micro-Hints.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpenModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-[#fff] font-bold text-xs sm:text-sm shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span>Mở bảng nháp</span>
            <span>✨</span>
          </button>
        </div>
      </div>

      {isOpenModal && <StemScratchpadModal onClose={() => setIsOpenModal(false)} />}
    </>
  )
}
