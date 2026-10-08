import { MAIN_CONTENT_ID } from '@core/PageShell'
import { isValidNewPassword } from '@core/clientAuth'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, Mic, PenLine, MessageCircle } from 'lucide-react'
import {
  login,
  register,
  loginWithGoogle,
  loginWithGoogleRedirect,
  handleOAuthRedirectCallback,
  GoogleAuthError,
  preloadOAuthProviders,
} from '../../lib/auth'
import { claimPendingReferral } from '../../lib/referral'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../context/useLang'
import { useToast } from '@core/ToastProvider'
import ThemeToggle from '../../components/ThemeToggle'
import type { UiLang } from '../../lib/uiLang'
import { buttonClass } from '@core/buttonStyles'

// Nhãn tính năng lấy từ i18n theo `key` (icon + màu cố định, chữ dịch theo ngôn ngữ)
const FEATURES = [
  { icon: MessageCircle, key: 'featChat', color: 'text-accent-400' },
  { icon: Mic, key: 'featSpeak', color: 'text-sky-400 theme-light:text-sky-900' },
  { icon: PenLine, key: 'featScore', color: 'text-violet-400 theme-light:text-violet-800' },
] as const

type AuthField = 'name' | 'email' | 'password'

export default function Login() {
  const nav = useNavigate()
  const { user, refresh, isGuest } = useAuth()
  const { T, lang, setLang } = useLang()
  const toast = useToast()
  const isA = lang === 'vi'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  // Ô nhập nào đang sai — để gắn aria-invalid (WCAG 3.3.1). Chỉ là thông tin trình bày, không
  // đổi logic kiểm hợp lệ.
  const [invalidFields, setInvalidFields] = useState<AuthField[]>([])
  const [loading, setLoading] = useState(false)
  const [forgotSending, setForgotSending] = useState(false)
  const [isPopupBlocked, setIsPopupBlocked] = useState(false)

  usePageTitle('Đăng nhập | Đồng Hành Cùng Bạn')

  useEffect(() => {
    // 1. Tải trước SDK OAuth
    preloadOAuthProviders()

    // 2. Tự động kiểm tra và hoàn tất nếu quay lại từ luồng Google OAuth Redirect.
    void handleOAuthRedirectCallback()
      .then(async (u) => {
        if (u) {
          await claimPendingReferral()
          await refresh()
          nav('/')
        }
      })
      .catch((err) => {
        console.error('[Login] OAuth redirect error:', err)
      })
  }, [nav, refresh])

  // Quên mật khẩu: gửi link reset qua email. LUÔN hiện cùng 1 thông báo bất kể email có tồn tại
  // hay không — server cũng cố ý không lộ điều đó (chống dò email hàng loạt), UI không được phá
  // nguyên tắc này bằng cách hiện lỗi "email không tồn tại".
  async function handleForgotPassword() {
    if (!email.trim() || !email.includes('@')) {
      toast.error(isA ? 'Nhập email trước khi bấm quên mật khẩu' : 'Enter your email first')
      return
    }
    setForgotSending(true)
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'request-password-reset', email: email.trim() }),
      })
    } catch {
      // Lỗi mạng — vẫn hiện thông báo chung bên dưới, không lộ thêm thông tin.
    } finally {
      setForgotSending(false)
      toast.success(
        isA
          ? 'Nếu email này có tài khoản, link đặt lại mật khẩu đã được gửi tới.'
          : 'If an account exists for this email, a reset link has been sent.',
      )
    }
  }

  // Đã đăng nhập → về trang chủ.
  // KHÔNG gọi nav() ngay trong thân render: đó là side effect trong lúc React đang render,
  // React bỏ qua nên URL vẫn đứng ở /login trong khi component đã `return null` → người dùng
  // thấy TRANG TRẮNG. Dùng <Navigate> (một component, chuyển hướng ở giai đoạn commit).
  // [2026-09-15 — chế độ Khách] PHẢI loại `isGuest` ở đây. `AuthProvider` nay cấp một `User` ảo
  // cho khách vãng lai, nên điều kiện `user` trần sẽ đúng với MỌI khách và đá họ khỏi chính
  // trang đăng nhập — tức không ai đăng ký/đăng nhập được nữa.
  if (user && !isGuest) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInvalidFields([])
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!isValidNewPassword(password)) {
          setError(
            isA
              ? 'Mật khẩu tối thiểu 15 ký tự, tối đa 72 byte UTF-8'
              : 'Password must be at least 15 characters and at most 72 UTF-8 bytes',
          )
          setInvalidFields(['password'])
          return
        }
        if (!name.trim()) {
          setError(T.errNameRequired)
          setInvalidFields(['name'])
          return
        }
        const u = await register(email.trim(), name.trim(), password)
        if (!u) {
          setError(T.errEmailInvalid)
          setInvalidFields(['email'])
          return
        }
        // Mời bạn: gửi mã đang chờ (lưu lúc vào landing qua link ?ref=) NGAY SAU khi đăng ký
        // thành công — chưa trao thưởng ở đây, server chỉ ghi nhận lời mời (xem api/referral.ts).
        await claimPendingReferral()
      } else {
        const u = await login(email.trim(), password)
        if (!u) {
          setError(T.errBadCredentials)
          setInvalidFields(['email', 'password'])
          return
        }
      }
      await refresh()
      nav('/')
    } catch {
      setError(T.errConnection)
    } finally {
      setLoading(false)
    }
  }

  // Đăng nhập bằng Google — Tối ưu popup không trễ cử chỉ người dùng,
  // tự động xử lý và gợi ý chuyển sang Redirect nếu trình duyệt chặn popup.
  async function googleSignIn() {
    setError('')
    setIsPopupBlocked(false)
    setLoading(true)
    try {
      const u = await loginWithGoogle()
      if (!u) {
        return
      }
      // Đăng nhập Google cũng là đường TẠO tài khoản mới (findOrCreateGoogleUser) nên cũng cần
      // gửi mã mời đang chờ. Server tự từ chối nếu tài khoản đã được ghi nhận lời mời trước đó.
      await claimPendingReferral()
      await refresh()
      nav('/')
    } catch (err: unknown) {
      if (err instanceof GoogleAuthError) {
        if (err.code === 'popup_blocked') {
          setIsPopupBlocked(true)
          setError(
            isA
              ? 'Trình duyệt đang chặn cửa sổ Popup. Bạn có thể cho phép Popup trên thanh địa chỉ hoặc bấm nút "Đăng nhập Google (Chuyển trang)" bên dưới.'
              : 'Browser blocked the popup window. Please allow popups or use "Continue with Google (Redirect)" below.',
          )
          return
        }
        if (err.code === 'origin_mismatch') {
          setError(
            isA
              ? 'Tên miền chưa được cấp phép trong Google Cloud Console (Authorized JavaScript origins).'
              : 'Domain origin is not authorized in Google Cloud Console.',
          )
          return
        }
        if (err.code === 'access_denied') {
          setError(isA ? 'Bạn đã từ chối cấp quyền Google.' : 'Google permission was denied.')
          return
        }
      }
      setError(T.errGoogle)
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleRedirect() {
    setError('')
    try {
      loginWithGoogleRedirect('/login')
    } catch {
      setError(T.errGoogle)
    }
  }

  const labelCls = 'block text-xs font-medium text-zinc-300 mb-1'
  const inputCls =
    'w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-accent-500/70 focus:bg-zinc-800 transition'

  return (
    // <main> = đích của liên kết "Bỏ qua tới nội dung chính" (WCAG 2.4.1, audit 2026-09-30 M7).
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden focus:outline-none"
    >
      {/* Gradient blobs nền */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent-500 rounded-full blur-[140px] opacity-[0.07] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500 rounded-full blur-[140px] opacity-[0.07] translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-500 rounded-full blur-[120px] opacity-[0.04] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Nút đổi giao diện & Chọn ngôn ngữ giao diện (VI/EN) — trang này không có header nên đặt góc trên */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle className="tap-44 flex items-center justify-center text-zinc-400 hover:text-white transition p-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 hover:bg-zinc-700/60 shrink-0" />
        <div
          className="flex gap-1 bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-1"
          role="group"
          aria-label={T.langToggleLabel}
        >
          {(['vi', 'en'] as const).map((l: UiLang) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`tap-44 flex items-center justify-center px-2.5 text-xs font-semibold rounded-lg transition ${
                lang === l
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="mb-7 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center mx-auto mb-4 shadow-2xl glow-accent">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{T.loginBrand}</h1>
        <p className="text-zinc-400 text-sm mt-1.5 tracking-wide">{T.loginTagline}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass rounded-2xl p-6 shadow-2xl shadow-black/40 animate-scale-in delay-100">
        {/* Tabs: hai nút chế độ, aria-pressed cho trình đọc màn hình biết đang ở chế độ nào */}
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
              }}
              className={`tap-44-y flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === m
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {m === 'login' ? T.loginTabLogin : T.loginTabRegister}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className={labelCls}>
                {T.namePlaceholder}
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={T.namePlaceholder}
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
            <label htmlFor="email" className={labelCls}>
              {T.emailPlaceholder}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={T.emailPlaceholder}
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
            <label htmlFor="password" className={labelCls}>
              {T.passwordPlaceholder}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                // Đăng ký → trình quản lý mật khẩu gợi ý mật khẩu mới; đăng nhập → điền mật khẩu cũ.
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={T.passwordPlaceholder}
                aria-invalid={invalidFields.includes('password')}
                aria-describedby={mode === 'register' ? 'password-hint' : undefined}
                className={`${inputCls} pr-11`}
                required
                minLength={mode === 'register' ? 15 : 1}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                aria-label={showPw ? T.hidePassword : T.showPassword}
                aria-pressed={showPw}
                /* [U9a] h-11 w-11 = 44px (luật vùng chạm của dự án; trước đây 32px). Sát mép phải
                   ô nhập, rộng đúng bằng đệm pr-11 (44px) nên không đè lên chữ. */
                className="absolute right-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-zinc-400 hover:text-zinc-300 transition"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Luật mật khẩu hiện cố định (không biến mất khi gõ như placeholder) — WCAG 3.3.2. */}
            {mode === 'register' && (
              <p id="password-hint" className="mt-1.5 text-xs text-zinc-400">
                {isA ? 'Mật khẩu tối thiểu 15 ký tự.' : 'Password must be at least 15 characters.'}
              </p>
            )}
          </div>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => void handleForgotPassword()}
              disabled={forgotSending}
              className="tap-44 text-xs text-zinc-400 hover:text-zinc-300 underline underline-offset-2 disabled:opacity-60"
            >
              {forgotSending
                ? isA
                  ? 'Đang gửi...'
                  : 'Sending...'
                : isA
                  ? 'Quên mật khẩu?'
                  : 'Forgot password?'}
            </button>
          )}

          {error && (
            <div
              role="alert"
              className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400 theme-light:text-red-900"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={buttonClass({ fullWidth: true, className: 'mt-1' })}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />{' '}
                {T.loginProcessing}
              </span>
            ) : mode === 'login' ? (
              T.loginSubmit
            ) : (
              T.registerSubmit
            )}
          </button>
        </form>

        {/* Ngăn cách "hoặc" */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-zinc-700/60" />
          <span className="text-xs text-zinc-400">{T.loginOr}</span>
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
          {T.googleSignIn}
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
            {isA ? 'Đăng nhập Google (Chuyển trang)' : 'Continue with Google (Redirect)'}
          </button>
        )}

        <p className="text-center text-xs text-zinc-400 mt-4">{T.loginPrivacy}</p>
      </div>

      {/* Feature pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 animate-fade-in delay-300">
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.key} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Icon className={`w-3.5 h-3.5 ${f.color}`} />
              <span>{T[f.key]}</span>
            </div>
          )
        })}
      </div>
    </main>
  )
}
