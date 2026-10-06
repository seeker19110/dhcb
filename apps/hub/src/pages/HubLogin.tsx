// apps/hub/src/pages/HubLogin.tsx — Trang Đăng nhập & Đăng ký Toàn cục (Centralized SSO Login).
// Phục vụ tại https://donghanhcungban.org/login và https://www.donghanhcungban.org/login.
// Tự động cấp cookie phiên Domain=.donghanhcungban.org và chuyển hướng người dùng an toàn về subdomains (en-vi., math., v.v.).

import { useState, useEffect } from 'react'
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  LogOut,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import {
  isValidNewPassword,
  login,
  register,
  loginWithGoogle,
  loginWithGoogleRedirect,
  handleOAuthRedirectCallback,
  GoogleAuthError,
  loginWithFacebook,
  loginWithApple,
  loginWithMicrosoft,
  preloadOAuthProviders,
  getCurrentUser,
  logout,
  getSafeRedirectUrl,
  type AppUser,
} from '@core/clientAuth'
import { ThemeToggle } from '@core/ThemeToggle'

// Đích mặc định sau đăng nhập = app nền tảng (không phải riêng môn tiếng Anh).
// Tên biến mới VITE_APP_URL; vẫn đọc VITE_ENGLISH_APP_URL để không phải sửa .env trên VPS.
const DEFAULT_REDIRECT_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ||
  (import.meta.env.VITE_ENGLISH_APP_URL as string | undefined) ||
  'https://en-vi.donghanhcungban.org/'

type AuthField = 'name' | 'email' | 'password'

export default function HubLogin() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  // Ô nhập nào đang sai — chỉ để gắn aria-invalid (WCAG 3.3.1), không đổi logic kiểm hợp lệ.
  const [invalidFields, setInvalidFields] = useState<AuthField[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSending, setForgotSending] = useState(false)
  const [isPopupBlocked, setIsPopupBlocked] = useState(false)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Đọc tham số ?redirect=... từ URL và xác thực an toàn
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : '',
  )
  const rawRedirect = searchParams.get('redirect') || searchParams.get('redirect_url')
  const targetRedirectUrl = getSafeRedirectUrl(rawRedirect, DEFAULT_REDIRECT_URL)

  useEffect(() => {
    preloadOAuthProviders()

    // 1. Kiểm tra nếu quay về từ Google OAuth Redirect Callback
    void handleOAuthRedirectCallback().then((u) => {
      if (u) {
        window.location.href = targetRedirectUrl
        return
      }

      // 2. Kiểm tra nếu đã có phiên đăng nhập từ trước
      void getCurrentUser().then((user) => {
        setCurrentUser(user)
        setCheckingAuth(false)
        // Nếu đã đăng nhập và có tham số redirect rõ ràng, tự động chuyển tiếp
        if (user && rawRedirect) {
          window.location.href = targetRedirectUrl
        }
      })
    })
  }, [rawRedirect, targetRedirectUrl])

  async function handleForgotPassword() {
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email trước khi bấm quên mật khẩu.')
      return
    }
    setForgotSending(true)
    setError('')
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-password-reset', email: email.trim() }),
      })
      setSuccessMsg('Nếu email này có tài khoản, link đặt lại mật khẩu đã được gửi tới hòm thư.')
    } catch {
      setSuccessMsg('Nếu email này có tài khoản, link đặt lại mật khẩu đã được gửi tới hòm thư.')
    } finally {
      setForgotSending(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInvalidFields([])
    setSuccessMsg('')
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!isValidNewPassword(password)) {
          setError('Mật khẩu tối thiểu 15 ký tự, tối đa 72 byte UTF-8')
          setInvalidFields(['password'])
          return
        }
        if (!name.trim()) {
          setError('Vui lòng nhập họ và tên của bạn.')
          setInvalidFields(['name'])
          return
        }
        const u = await register(email.trim(), name.trim(), password)
        if (!u) {
          setError('Email này đã được sử dụng hoặc thông tin không hợp lệ.')
          setInvalidFields(['email'])
          return
        }
      } else {
        const u = await login(email.trim(), password)
        if (!u) {
          setError('Email hoặc mật khẩu không chính xác.')
          setInvalidFields(['email', 'password'])
          return
        }
      }
      // Chuyển hướng tới trang đích an toàn (subdomain của nền tảng)
      window.location.href = targetRedirectUrl
    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function googleSignIn() {
    setError('')
    setSuccessMsg('')
    setIsPopupBlocked(false)
    setLoading(true)
    try {
      const u = await loginWithGoogle()
      if (!u) return
      window.location.href = targetRedirectUrl
    } catch (err: unknown) {
      if (err instanceof GoogleAuthError) {
        if (err.code === 'popup_blocked') {
          setIsPopupBlocked(true)
          setError(
            'Trình duyệt đang chặn cửa sổ Popup. Bạn có thể cho phép Popup trên thanh địa chỉ hoặc bấm nút "Đăng nhập Google (Chuyển trang)" bên dưới.',
          )
          return
        }
        if (err.code === 'origin_mismatch') {
          setError(
            'Tên miền chưa được cấp phép trong Google Cloud Console (Authorized JavaScript origins).',
          )
          return
        }
        if (err.code === 'access_denied') {
          setError('Bạn đã từ chối cấp quyền đăng nhập Google.')
          return
        }
      }
      setError('Không thể kết nối Google. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleRedirect() {
    setError('')
    try {
      const redirectPath = `/login${window.location.search}`
      loginWithGoogleRedirect(redirectPath)
    } catch {
      setError('Không thể khởi tạo luồng chuyển hướng Google.')
    }
  }

  async function facebookSignIn() {
    setError('')
    setLoading(true)
    try {
      const u = await loginWithFacebook()
      if (!u) return
      window.location.href = targetRedirectUrl
    } catch {
      setError('Không thể kết nối Facebook. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function appleSignIn() {
    setError('')
    setLoading(true)
    try {
      const u = await loginWithApple()
      if (!u) return
      window.location.href = targetRedirectUrl
    } catch {
      setError('Không thể kết nối Apple. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function microsoftSignIn() {
    setError('')
    setLoading(true)
    try {
      const u = await loginWithMicrosoft()
      if (!u) return
      window.location.href = targetRedirectUrl
    } catch {
      setError('Không thể kết nối Microsoft. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setLoading(true)
    try {
      await logout()
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }

  const labelCls = 'block text-xs font-medium text-zinc-300 mb-1'
  const inputCls =
    'w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-accent-500/70 focus:bg-zinc-800 transition'

  if (checkingAuth) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-400 rounded-full animate-spin mb-3" />
        <p className="text-xs text-zinc-400 font-medium">Đang kiểm tra trạng thái xác thực...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden py-10">
      {/* Background glow blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent-500 rounded-full blur-[140px] opacity-[0.07] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500 rounded-full blur-[140px] opacity-[0.07] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle lang="vi" />
      </div>

      {/* Logo & Brand Title */}
      <div className="mb-6 text-center animate-fade-in">
        <a
          href="/"
          aria-label="Đồng hành cùng bạn — về trang chủ"
          className="inline-flex items-center gap-2 mb-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-500 to-accent-400 flex items-center justify-center text-[#09090b] shadow-xl shadow-accent-500/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-[#09090b]" />
          </div>
        </a>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Đồng hành cùng bạn
        </h1>
        <p className="text-zinc-300 text-xs sm:text-sm mt-1">
          Một tài khoản cho cả nền tảng — Học tập, Ghi chú và mọi môn học
        </p>
      </div>

      {/* Card container */}
      <div className="w-full max-w-sm glass rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/50 border border-zinc-800/80">
        {currentUser ? (
          /* Màn hình khi người dùng ĐÃ ĐĂNG NHẬP */
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center mx-auto text-accent-400 theme-light:text-accent-700">
              <User className="w-7 h-7" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-accent-400 theme-light:text-accent-700 font-bold mb-1">
                Tài khoản hiện tại
              </div>
              <h2 className="text-lg font-bold text-white truncate">{currentUser.name}</h2>
              <p className="text-xs text-zinc-400 truncate">{currentUser.email}</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left text-xs text-zinc-300 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Gói cước:</span>
                <span className="font-semibold uppercase text-accent-400 theme-light:text-accent-700">
                  {currentUser.plan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Trạng thái SSO:</span>
                <span className="text-emerald-400 theme-light:text-emerald-800 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={targetRedirectUrl}
                className="w-full inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-400 text-[#09090b] font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-accent-500/20 active:scale-[0.98]"
              >
                <span>Tiếp tục vào nền tảng</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium py-2.5 rounded-xl text-xs transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất khỏi tài khoản này</span>
              </button>
            </div>
          </div>
        ) : (
          /* Màn hình FORM ĐĂNG NHẬP / ĐĂNG KÝ */
          <>
            {/* Tabs */}
            <div className="flex mb-5 bg-zinc-800/60 rounded-xl p-1 gap-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => {
                    setMode(m)
                    setError('')
                    setInvalidFields([])
                    setSuccessMsg('')
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    mode === m
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {m === 'login' ? 'Đăng nhập' : 'Đăng ký mới'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label htmlFor="hub-name" className={labelCls}>
                    Họ và tên
                  </label>
                  <input
                    id="hub-name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Họ và tên của bạn"
                    aria-invalid={invalidFields.includes('name')}
                    className={inputCls}
                    required
                    // Ô nhập này chỉ xuất hiện SAU một hành động của người dùng (mở form / bấm "thêm"),
                    // nên đưa tiêu điểm vào đó là chuyển tiêu điểm đúng chỗ theo WAI-ARIA, không phải
                    // cướp tiêu điểm lúc tải trang (audit 2026-09-05, F1).
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  />
                </div>
              )}
              <div>
                <label htmlFor="hub-email" className={labelCls}>
                  Email
                </label>
                <input
                  id="hub-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ email"
                  aria-invalid={invalidFields.includes('email')}
                  className={inputCls}
                  required
                  // Trang đăng nhập chỉ có một việc để làm; đưa tiêu điểm vào ô email giúp người dùng
                  // bàn phím khỏi phải Tab qua thanh điều hướng (audit 2026-09-05, F1).
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={mode === 'login'}
                />
              </div>
              <div>
                <label htmlFor="hub-password" className={labelCls}>
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="hub-password"
                    name="password"
                    minLength={mode === 'register' ? 15 : 1}
                    type={showPw ? 'text' : 'password'}
                    // Đăng ký → gợi ý mật khẩu mới; đăng nhập → điền mật khẩu đã lưu.
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    aria-invalid={invalidFields.includes('password')}
                    aria-describedby={mode === 'register' ? 'hub-password-hint' : undefined}
                    /* pr-12: chừa chỗ cho nút hiện/ẩn mật khẩu nay rộng 44px (tap-44). */
                    className={`${inputCls} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPw}
                    /* tap-44 thay cho h-8 w-8 (32px) — dưới sàn vùng chạm 44px. */
                    className="tap-44 absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-400 hover:text-zinc-300 transition"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Luật mật khẩu hiện cố định (không biến mất khi gõ như placeholder) — WCAG 3.3.2. */}
                {mode === 'register' && (
                  <p id="hub-password-hint" className="mt-1.5 text-xs text-zinc-400">
                    Mật khẩu tối thiểu 15 ký tự.
                  </p>
                )}
              </div>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={forgotSending}
                  className="text-xs text-zinc-400 hover:text-zinc-300 underline underline-offset-2 disabled:opacity-60"
                >
                  {forgotSending ? 'Đang gửi...' : 'Quên mật khẩu?'}
                </button>
              )}

              {error && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400 theme-light:text-red-800 leading-relaxed"
                >
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-400 theme-light:text-emerald-800 leading-relaxed">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-teal-400 disabled:opacity-50 text-[#09090b] font-bold py-3 rounded-xl text-sm transition active:scale-[0.98] mt-1 shadow-lg shadow-accent-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#09090b]/30 border-t-[#09090b] rounded-full animate-spin inline-block" />
                    Đang xử lý...
                  </span>
                ) : mode === 'login' ? (
                  'Đăng nhập'
                ) : (
                  'Tạo tài khoản'
                )}
              </button>
            </form>

            {/* Ngăn cách "hoặc" */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-zinc-700/60" />
              <span className="text-xs text-zinc-400">hoặc tiếp tục với</span>
              <div className="flex-1 h-px bg-zinc-700/60" />
            </div>

            {/* Nút đăng nhập bằng Google */}
            <button
              type="button"
              onClick={googleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-[#ffffff] hover:bg-[#f4f4f5] disabled:opacity-50 text-[#27272a] font-medium py-3 rounded-xl text-sm transition active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
                />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>

            {/* Nút đăng nhập Google qua luồng Chuyển trang (Redirect Fallback) khi Popup bị chặn */}
            {isPopupBlocked && (
              <button
                type="button"
                onClick={handleGoogleRedirect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 theme-light:text-amber-900 font-medium py-2.5 rounded-xl text-xs transition active:scale-[0.98] mt-2"
              >
                <span>🌐</span>
                <span>Đăng nhập Google (Chuyển trang)</span>
              </button>
            )}

            {/* Nút đăng nhập bằng Facebook */}
            <button
              type="button"
              onClick={facebookSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-[#166FE5] hover:bg-[#1160CC] disabled:opacity-50 text-[#fff] font-medium py-3 rounded-xl text-sm transition active:scale-[0.98] mt-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
              </svg>
              <span>Đăng nhập bằng Facebook</span>
            </button>

            {/* Nút đăng nhập bằng Apple */}
            <button
              type="button"
              onClick={appleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-black hover:bg-zinc-900 disabled:opacity-50 text-[#fff] font-medium py-3 rounded-xl text-sm transition active:scale-[0.98] mt-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.36 1.43c0 1.14-.46 2.23-1.2 3.03-.8.86-2.1 1.53-3.19 1.44-.13-1.1.42-2.26 1.16-3.02.82-.85 2.24-1.5 3.23-1.45zm3.16 16.6c-.35.8-.77 1.55-1.28 2.25-.7.96-1.27 1.62-1.71 2-.68.63-1.4.95-2.18.97-.56.01-1.23-.16-2.01-.5-.78-.34-1.5-.5-2.15-.5-.68 0-1.42.16-2.22.5-.8.34-1.44.52-1.94.54-.75.03-1.49-.3-2.22-1-.47-.42-1.08-1.12-1.81-2.1-.79-1.06-1.44-2.29-1.94-3.7-.54-1.52-.81-3-.81-4.42 0-1.63.35-3.04 1.06-4.22.55-.95 1.28-1.7 2.19-2.25.91-.55 1.9-.83 2.96-.85.6-.01 1.38.19 2.35.58.96.4 1.58.6 1.85.6.2 0 .89-.23 2.05-.7.99-.4 1.83-.56 2.5-.5 1.85.15 3.24.88 4.16 2.2-1.65 1-2.47 2.4-2.46 4.2.01 1.4.52 2.57 1.53 3.5.45.43.96.76 1.51 1-.12.35-.25.7-.4 1.03z" />
              </svg>
              <span>Đăng nhập bằng Apple</span>
            </button>

            {/* Nút đăng nhập bằng Microsoft */}
            <button
              type="button"
              onClick={microsoftSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-[#2f2f2f] hover:bg-[#242424] disabled:opacity-50 text-[#fff] font-medium py-3 rounded-xl text-sm transition active:scale-[0.98] mt-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#f25022" d="M1 1h10v10H1z" />
                <path fill="#7fba00" d="M13 1h10v10H13z" />
                <path fill="#00a4ef" d="M1 13h10v10H1z" />
                <path fill="#ffb900" d="M13 13h10v10H13z" />
              </svg>
              <span>Đăng nhập bằng Microsoft</span>
            </button>
          </>
        )}

        <div className="mt-5 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 inline-block text-accent-500 mr-1" />
          Bảo mật phiên Single Sign-On (SSO) tự động
        </div>
      </div>
    </div>
  )
}
