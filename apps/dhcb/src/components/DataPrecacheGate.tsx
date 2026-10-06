// apps/dhcb/src/components/DataPrecacheGate.tsx — Cổng quyết định khi nào tải ngầm dữ liệu học
// ngoại tuyến (audit 2026-09-30 M14). Không vẽ gì; chỉ gọi start/stop của lib/dataPrecache theo
// chính sách ở lib/offlineDownload.ts.
//
// Đánh giá lại khi: trạng thái đăng nhập đổi · chuyển trang (người mới vừa học xong phiên đầu
// sẽ được tải từ lần chuyển trang kế tiếp) · công tắc ở Cài đặt đổi.
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  OFFLINE_DOWNLOAD_EVENT,
  precacheBlockReason,
  readPrecacheConditions,
} from '../lib/offlineDownload'

export default function DataPrecacheGate() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const [settingVersion, setSettingVersion] = useState(0)
  // Chỉ nạp module tải khi THẬT SỰ cần (khách không bao giờ tải chunk này).
  const startedRef = useRef(false)

  useEffect(() => {
    const onChange = () => setSettingVersion((v) => v + 1)
    window.addEventListener(OFFLINE_DOWNLOAD_EVENT, onChange)
    return () => window.removeEventListener(OFFLINE_DOWNLOAD_EVENT, onChange)
  }, [])

  const userId = user?.id
  const isGuest = user?.isGuest
  useEffect(() => {
    if (loading) return
    const reason = precacheBlockReason(
      readPrecacheConditions(userId ? { id: userId, isGuest } : null),
    )
    if (reason === null) {
      startedRef.current = true
      import('../lib/dataPrecache')
        .then((m) => m.startDataPrecache())
        .catch(() => {
          /* không tải được chunk — lần chuyển trang sau thử lại */
        })
    } else if (startedRef.current) {
      startedRef.current = false
      import('../lib/dataPrecache').then((m) => m.stopDataPrecache()).catch(() => {})
    }
  }, [loading, userId, isGuest, pathname, settingVersion])

  return null
}
