// apps/dhcb/src/components/OfflineStatusBanner.tsx — Thanh thông báo trạng thái ngoại tuyến (Offline Status)
// Tự động xuất hiện khi mất kết nối mạng và biến mất khi có mạng trở lại.

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineStatusBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      const timer = setTimeout(() => setShowReconnected(false), 3500)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (showReconnected) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="bg-emerald-900/90 border-b border-emerald-700/60 text-emerald-100 theme-light:text-emerald-900 px-3 py-1.5 text-xs flex items-center justify-center gap-2 transition duration-300 animate-fadeIn"
      >
        <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-300 theme-light:text-emerald-900" />
        <span>Đã kết nối lại Internet — Đang đồng bộ tiến độ học...</span>
      </aside>
    )
  }

  if (!isOffline) return null

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="bg-amber-950/90 border-b border-amber-800/60 text-amber-200 theme-light:text-amber-900 px-3 py-1.5 text-xs flex items-center justify-center gap-2 transition duration-300"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400 theme-light:text-amber-900" />
      <span>Bạn đang ngoại tuyến — Vẫn có thể ôn tập từ vựng & bài học đã tải sẵn.</span>
    </aside>
  )
}
