// ── Màn "Khoảnh khắc" ăn mừng dùng chung ─────────────────────────────────────
// (V-2, docs/research/cai-tien-trai-nghiem-hoc-2026-07-11.md — E1/E2)
// Overlay toàn màn: icon lớn scale-in + tiêu đề + nội dung con + 1 nút chính.
// Confetti nạp LƯỜI qua import() (lib/confetti.ts, chunk riêng — 0 chi phí bundle
// đầu trang) và tự bỏ qua khi người dùng bật "giảm chuyển động".
// Nguyên tắc: chỉ ăn mừng thành tựu THẬT (streak/mốc từ vựng/đạt bài thi).

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { haptics } from '../lib/haptics'
import { sound } from '../lib/sound'
import { buttonClass } from '@core/buttonStyles'

export default function Celebration({
  icon,
  title,
  subtitle,
  ctaLabel,
  onDone,
  children,
}: {
  icon: string // emoji lớn giữa màn (🔥 🏆 🎓…)
  title: string
  subtitle?: string
  ctaLabel: string
  onDone: () => void
  children?: React.ReactNode // nội dung thêm (vd hàng chấm tuần)
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    haptics.success()
    sound.milestone()
    // Confetti: chunk lazy, lỗi tải (mạng yếu) thì bỏ qua êm — ăn mừng vẫn hiện.
    let alive = true
    import('../lib/confetti')
      .then((m) => {
        if (alive && overlayRef.current) m.burst(overlayRef.current)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Portal ra document.body: tổ tiên có `transform` thành containing block, làm `fixed`
  // neo theo khối cha thay vì viewport. Gốc của bẫy này (animate-fade-in giữ translateY(0)
  // vì fill-mode both) đã gỡ ở changelog 0474, nhưng tổ tiên vẫn có `transform` TRONG lúc
  // hoạt ảnh chạy — portal giữ lại để luôn phủ đúng.
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/95 flex items-center justify-center px-6 pb-safe pt-safe"
    >
      <div className="w-full max-w-sm text-center animate-scale-in">
        <p className="text-6xl mb-4" aria-hidden="true">
          {icon}
        </p>
        {/* aria-live để screen reader đọc thành tựu 1 lần khi màn hiện */}
        <p aria-live="polite" className="text-2xl font-bold text-white mb-1.5">
          {title}
        </p>
        {subtitle && <p className="text-sm text-zinc-400 mb-4">{subtitle}</p>}
        {children}
        <button
          onClick={onDone}
          className={buttonClass({ size: 'lg', fullWidth: true, className: 'mt-6' })}
        >
          {ctaLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}
