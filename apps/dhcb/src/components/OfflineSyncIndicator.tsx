// apps/dhcb/src/components/OfflineSyncIndicator.tsx — Dải báo trạng thái ngoại tuyến & đồng bộ.
//
// S09-2: dải này TỪNG nói dối. Nó đọc `offlineStore.ts` — một hàng đợi "giả" không có ai xếp
// hàng vào (0 caller), và "đồng bộ" bằng `flushOfflineQueue(async () => true)`, tức là XOÁ mục
// mà không gửi gì lên server. Giờ nó đọc hàng đợi THẬT (`syncOutbox`, theo chủ sở hữu) nên số
// "N mục chờ đồng bộ" là số thật, và có thêm trạng thái "hết phiên đăng nhập" — trước đây người
// dùng không bao giờ biết vì sao dữ liệu không lên được server.
import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, CheckCircle2, LogIn, PauseCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { isBlockedByAuth, isGradingUnavailable, pending, subscribe } from '../lib/syncOutbox'

export default function OfflineSyncIndicator() {
  const { user } = useAuth()
  const uid = user?.id ?? ''
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [gradingPaused, setGradingPaused] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  useEffect(() => {
    let alive = true
    // Số mục chờ trước đó — chỉ khi nó TỪ > 0 về 0 mới được khoe "đã đồng bộ xong".
    let previous = uid ? pending(uid) : 0
    // [2026-09-22, audit UI/UX P1-5] Chỉ khoe "đã đồng bộ" khi trước đó hàng đợi bị KẸT THẬT
    // (mất mạng hoặc hết phiên đăng nhập) — tức người dùng đã thấy dải cảnh báo và cần biết
    // nó đã qua. Đồng bộ nền bình thường (mở trang → kéo → đẩy) thì im lặng: audit chụp 20
    // trang thấy dải xanh bắn ở MỌI trang, chồng lên cả thông báo "Chưa tải được tiến độ".
    let biKet = false

    const refresh = (changedUid?: string) => {
      if (!alive || !uid) return
      if (changedUid !== undefined && changedUid !== uid) return // hàng đợi của chủ khác
      const count = pending(uid)
      const blocked = isBlockedByAuth(uid)
      const offline = typeof navigator !== 'undefined' ? !navigator.onLine : false
      setPendingCount(count)
      setNeedsLogin(blocked)
      setGradingPaused(isGradingUnavailable(uid))
      if (count > 0 && (blocked || offline)) biKet = true
      if (previous > 0 && count === 0) {
        if (biKet) {
          setJustSynced(true)
          window.setTimeout(() => {
            if (alive) setJustSynced(false)
          }, 4000)
        }
        biKet = false
      }
      previous = count
    }

    const onNetwork = () => {
      if (!alive) return
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
      refresh()
    }

    const unsubscribe = subscribe(refresh)
    window.addEventListener('online', onNetwork)
    window.addEventListener('offline', onNetwork)
    onNetwork()

    return () => {
      alive = false
      unsubscribe()
      window.removeEventListener('online', onNetwork)
      window.removeEventListener('offline', onNetwork)
    }
  }, [uid])

  if (isOnline && pendingCount === 0 && !justSynced) return null

  // Nền của ba tông dưới đây là màu CỐ ĐỊNH TỐI ở mọi theme (họ amber/emerald, sắc 950), nên
  // chữ phải sáng ở mọi theme. Bản đầu có thêm biến thể `theme-light:` đè chữ ĐẬM cùng họ lên
  // chính nền đậm đó ở 3 theme nền sáng: axe đo được 1,16:1 (fg #064e3b trên bg #1b4136) ở
  // trang chủ · /tien-do · /lich-su-hoc · /tro-truyen · /luyen-viet, theme blue-sky/pink/kid.
  // Sắc 200 của hai họ này là màu bảng Tailwind nên KHÔNG bị đảo theo theme (chỉ `text-white`
  // map sang `--c-white` mới bị) — để nguyên là đúng cho cả 5 theme.
  // Nền để ĐỤC (bỏ `/90`): dải này phủ lên nội dung nên cần đọc được, và cổng
  // `scripts/fixed-color-contrast-audit.ts` chỉ nhận ra "nền đặc" khi không có phần trăm mờ.
  const tone = !isOnline
    ? 'bg-amber-950 border-amber-600/50 text-amber-200'
    : needsLogin || gradingPaused
      ? 'bg-amber-950 border-amber-600/50 text-amber-200'
      : justSynced
        ? 'bg-emerald-950 border-emerald-600/50 text-emerald-200'
        : 'bg-[var(--a-surface)] border-[var(--a-border)] text-[var(--a-text)]'

  return (
    // `bottom-20` (80px) THẤP HƠN BottomNav thật (5.25rem + safe-area ≈ 84px trở lên) nên
    // dải thông báo đè lên thanh điều hướng. Dùng biến `--bnav-h` (index.css) — biến này
    // tự về 0px từ 1024px trở lên, nên desktop chỉ còn 1rem cách mép dưới.
    <div
      // KHÔNG dùng `left-1/2 -translate-x-1/2`: `animate-fade-in` cũng đặt `transform`, và khai
      // báo trong @keyframes THẮNG utility class → dải bị đẩy lệch hẳn sang phải (đo 2026-09-16 ở
      // 390px: x = 195px trong khi đúng phải là 16px, tràn khỏi mép phải màn hình). Canh giữa
      // bằng `inset-x-0 mx-auto` thì không cần `transform` nên animation không phá được.
      className="fixed bottom-[calc(1rem+var(--bnav-h))] inset-x-0 mx-auto z-50 w-11/12 max-w-md animate-fade-in pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium transition ${tone}`}
      >
        <div className="flex items-center gap-2.5">
          {/* Biểu tượng KHÔNG đặt màu riêng: chúng thừa kế `currentColor` của dải, vốn đã được
            chọn đúng cho nền cố định tối. Đặt màu cố định riêng ở đây từng làm cổng
            `scripts/fixed-color-contrast-audit.ts` báo dương tính giả — nó soi theo TỪNG DÒNG
            nên không thấy được nền tối nằm ở thẻ cha. */}

          {!isOnline ? (
            <WifiOff className="w-4 h-4 shrink-0" />
          ) : needsLogin ? (
            <LogIn className="w-4 h-4 shrink-0" />
          ) : gradingPaused ? (
            <PauseCircle className="w-4 h-4 shrink-0" />
          ) : justSynced ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <RefreshCw className="w-4 h-4 text-[var(--a-accent)] shrink-0 animate-spin" />
          )}

          <div>
            {!isOnline ? (
              <span>
                Đang học offline
                {pendingCount > 0 && ` (${pendingCount} mục chờ đồng bộ)`}
              </span>
            ) : needsLogin ? (
              <span>{pendingCount} mục chờ đồng bộ — đăng nhập lại để gửi lên</span>
            ) : gradingPaused ? (
              <span>
                Chấm bài đang bảo trì. Mã bài được giữ trên thiết bị, chưa xác nhận hoàn thành. Bạn
                vẫn có thể chạy thử.
              </span>
            ) : justSynced ? (
              <span>Đã đồng bộ dữ liệu học tập thành công!</span>
            ) : (
              <span>Đang đồng bộ dữ liệu ({pendingCount} mục)...</span>
            )}
          </div>
        </div>

        {!isOnline && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-900 text-amber-300 border border-amber-700/50 shrink-0">
            Tự lưu cục bộ
          </span>
        )}
      </div>
    </div>
  )
}
