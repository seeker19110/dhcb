import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { AuthContext } from './authContext'
import { getCurrentUser, getCurrentUserVerified, SessionVerificationError } from '../lib/auth'
import { preloadBrowseChunks } from '../lib/preloadBrowse'
import { resetPreload } from '../lib/preloadState'
import { clearAudioCache } from '../lib/audioCache'
import { cacheAllowedVoices } from '../lib/voiceTiers'
import { getStoredToken, clearStoredToken, SESSION_MARKER_KEY } from '@core/authHeader'
import { getGuestId } from '@core/guestId'
import { mergeGuestProgressInto, hasGuestProgress } from '../lib/guestProgress'
import type { User } from '../types'

// [2026-09-15 — chế độ Khách] Không có phiên đăng nhập thì app KHÔNG còn chạy với `user: null`
// nữa: ta cấp một `User` ảo mang id khách (`guest_<uuid>`). Nhờ vậy mọi trang nội dung — vốn đã
// nhận `uid: string` và lưu localStorage theo uid — chạy nguyên vẹn cho khách mà không phải sửa
// từng trang. Đặc tả: docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md
//
// `onboarded: true` là CỐ Ý: khách không có bước onboarding nào để làm (nó ghi lên server), bắt
// họ qua đó chỉ tạo ngõ cụt. `plan: 'free'` để mọi gate theo gói coi khách như người dùng miễn
// phí — quyền lợi VIP vẫn do server quyết, khách không chạm tới được.
function buildGuestUser(): User {
  return {
    id: getGuestId(),
    email: '',
    name: 'Khách',
    plan: 'free',
    onboarded: true,
    isGuest: true,
    createdAt: Date.now(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const wasLoggedIn = useRef(false)

  const generation = useRef(0)
  const mounted = useRef(false)

  const applyUser = useCallback(async (u: User | null, isCurrent: () => boolean) => {
    if (!isCurrent()) return
    // Token vừa mất (đăng xuất / hết hạn) mà trước đó đang đăng nhập → dọn state client-only
    // (Giai đoạn B: không còn onAuthStateChange của Supabase để bắt sự kiện SIGNED_OUT).
    if (wasLoggedIn.current && !u) {
      resetPreload()
      void clearAudioCache()
    }
    // Vừa có phiên THẬT (đăng ký/đăng nhập bằng bất kỳ đường nào: email, Google, Facebook,
    // Apple, Microsoft, OAuth redirect) → hợp nhất tiến độ khách vào tài khoản NGAY, trước khi
    // bất cứ luồng đồng bộ nào kịp ghi đè. Đặt ở đây thay vì trong từng hàm login là có chủ ý:
    // một chỗ duy nhất, không thể quên đường nào.
    if (u && !wasLoggedIn.current && hasGuestProgress()) {
      await mergeGuestProgressInto(u.id).catch((err) => {
        console.warn('[auth] hợp nhất tiến độ khách thất bại (tiến độ cục bộ vẫn còn):', err)
      })
    }
    if (!isCurrent()) return
    wasLoggedIn.current = !!u
    // Không có phiên → chạy ở chế độ Khách thay vì chặn toàn bộ app.
    setUser(u ?? buildGuestUser())
    // Cache giọng gói thật (Free/VIP) để chế độ "giọng ngẫu nhiên" (lib/tts.ts) chỉ random
    // đúng trong phạm vi được phép — tránh random ra giọng rồi bị server âm thầm hạ xuống.
    if (u) cacheAllowedVoices(u.plan)
  }, [])

  const refresh = useCallback(async () => {
    const request = ++generation.current
    const isCurrent = () => mounted.current && request === generation.current
    try {
      const u = await getCurrentUser()
      // Giữ cơ chế nạp phiên cũ, gồm cookie adoption có thể đặt token trong lúc đọc.
      await applyUser(u, isCurrent)
    } finally {
      // Request cũ trong StrictMode không được mở route gate trước phiên hiện hành.
      if (isCurrent()) setLoading(false)
    }
  }, [applyUser])

  const refreshVerified = useCallback(
    async (expectedUserId: string): Promise<User> => {
      const request = ++generation.current
      const token = getStoredToken()
      const isCurrent = () =>
        mounted.current && request === generation.current && token === getStoredToken()
      try {
        const u = await getCurrentUserVerified()
        if (!isCurrent() || u.id !== expectedUserId) throw new Error('Phiên đăng nhập đã thay đổi')
        await applyUser(u, isCurrent)
        if (!isCurrent()) throw new Error('Phiên đăng nhập đã thay đổi')
        return u
      } catch (error) {
        if (
          isCurrent() &&
          error instanceof SessionVerificationError &&
          error.reason === 'unauthorized'
        ) {
          clearStoredToken()
          await applyUser(
            null,
            () => mounted.current && request === generation.current && !getStoredToken(),
          )
        }
        throw error
      }
    },
    [applyUser],
  )

  useEffect(() => {
    mounted.current = true
    // Gọi qua then() để mọi setState chạy trong callback bất đồng bộ
    // (luật react-hooks/set-state-in-effect — không setState đồng bộ trong effect).
    void Promise.resolve()
      .then(refresh)
      .catch(() => undefined)

    // Cờ UI không bí mật giúp đồng bộ đăng nhập/đăng xuất giữa các tab.
    // Cookie vẫn là nguồn xác thực duy nhất khi gọi máy chủ.
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === SESSION_MARKER_KEY || e.key === 'gsa_session_token_v1')
        refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      mounted.current = false
      generation.current += 1
      window.removeEventListener('storage', onStorage)
    }
  }, [refresh])

  // Khi user đăng nhập xong → CHỈ warm-up nhẹ chunk đầu của trang Bài học + Cụm từ
  // khi browser rảnh. KHÔNG tải từ điển ở đây nữa (nặng ~560KB) — việc đó để trang
  // Học tự lo khi user thật sự vào (xem preloadLearnData trong Learn.tsx), nên người
  // chỉ dùng Chat/Tra từ/Viết không phải tải dữ liệu họ không dùng.
  const userId = user?.isGuest ? undefined : user?.id
  useEffect(() => {
    if (!userId) return
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(
        () => {
          void preloadBrowseChunks()
        },
        { timeout: 3000 },
      )
      return () => cancelIdleCallback(id)
    } else {
      const tid = setTimeout(() => {
        void preloadBrowseChunks()
      }, 500)
      return () => clearTimeout(tid)
    }
  }, [userId])

  // `isGuest` tách riêng khỏi `user` để nơi gọi không phải nhớ `user?.isGuest === true`; hai
  // giá trị luôn khớp nhau vì cùng sinh ra từ một chỗ.
  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, refreshVerified, isGuest: user?.isGuest === true }}
    >
      {children}
    </AuthContext.Provider>
  )
}
