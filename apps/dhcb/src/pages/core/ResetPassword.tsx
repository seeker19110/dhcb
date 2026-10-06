import { MAIN_CONTENT_ID } from '@core/PageShell'
import { isValidNewPassword } from '@core/clientAuth'
// src/pages/ResetPassword.tsx — Trang đích của link "Đặt mật khẩu mới" gửi qua email
// (xem api/_lib/passwordReset.ts). Route /reset-password?token=... KHÔNG cần đăng nhập.
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { usePageTitle } from '../../lib/usePageTitle'
import { useLang } from '../../context/useLang'
import { Button } from '@core/Button'

async function postAuth(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    return res.ok ? { ok: true } : { ok: false, error: data.error }
  } catch {
    return { ok: false, error: 'Lỗi kết nối, thử lại sau' }
  }
}

export default function ResetPassword() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const { T, lang } = useLang()
  const isA = lang === 'vi'
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  usePageTitle('Đặt lại mật khẩu | Đồng Hành Cùng Bạn')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isValidNewPassword(password)) {
      setError(
        isA
          ? 'Mật khẩu tối thiểu 15 ký tự, tối đa 72 byte UTF-8'
          : 'Password must be at least 15 characters and at most 72 UTF-8 bytes',
      )
      return
    }
    setLoading(true)
    const r = await postAuth({ action: 'reset-password', token, newPassword: password })
    setLoading(false)
    if (r.ok) {
      setDone(true)
    } else {
      setError(r.error ?? (isA ? 'Không đặt lại được mật khẩu' : 'Could not reset password'))
    }
  }

  if (!token) {
    return (
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 focus:outline-none"
      >
        <p className="text-zinc-300 text-sm text-center max-w-sm">
          {isA
            ? 'Link không hợp lệ — thiếu mã xác nhận. Hãy mở link từ email gửi tới bạn.'
            : 'Invalid link — missing token. Please open the link from your email.'}
        </p>
        <button
          type="button"
          onClick={() => nav('/login')}
          className="tap-44 mt-4 text-accent-400 underline underline-offset-2 text-sm"
        >
          {isA ? 'Về trang đăng nhập' : 'Back to login'}
        </button>
      </main>
    )
  }

  if (done) {
    return (
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 focus:outline-none text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-accent-500/15 text-accent-400 flex items-center justify-center mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <p className="text-white font-semibold mb-1">
          {isA ? 'Đã đặt mật khẩu mới thành công!' : 'Password reset successful!'}
        </p>
        <p className="text-zinc-400 text-sm mb-5 max-w-sm">
          {isA
            ? 'Vì lý do an toàn, bạn cần đăng nhập lại trên mọi thiết bị bằng mật khẩu mới.'
            : 'For security, please sign in again on all devices with your new password.'}
        </p>
        <button
          type="button"
          onClick={() => nav('/login')}
          className="tap-44 rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-[#09090b]"
        >
          {isA ? 'Đăng nhập ngay' : 'Sign in now'}
        </button>
      </main>
    )
  }

  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-4 focus:outline-none"
    >
      <div className="w-full max-w-sm glass rounded-2xl p-6 shadow-2xl shadow-black/40">
        <h1 className="text-xl font-bold text-white mb-1">
          {isA ? 'Đặt mật khẩu mới' : 'Set a new password'}
        </h1>
        <p className="text-zinc-400 text-sm mb-5">
          {isA
            ? 'Nhập mật khẩu mới cho tài khoản của bạn.'
            : 'Enter a new password for your account.'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="new-password" className="block text-xs font-medium text-zinc-300 mb-1">
              {isA ? 'Mật khẩu mới' : 'New password'}
            </label>
            <div className="relative">
              <input
                id="new-password"
                name="new-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isA ? 'Mật khẩu mới (ít nhất 15 ký tự)' : 'New password (at least 15 characters)'
                }
                aria-invalid={error !== ''}
                aria-describedby="new-password-hint"
                minLength={15}
                // Ô nhập này chỉ xuất hiện SAU một hành động của người dùng (mở form / bấm "thêm"),
                // nên đưa tiêu điểm vào đó là chuyển tiêu điểm đúng chỗ theo WAI-ARIA, không phải
                // cướp tiêu điểm lúc tải trang (audit 2026-09-05, F1).
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                required
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 pr-11 text-sm text-zinc-100 outline-none focus:border-accent-500/70"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                aria-label={showPw ? T.hidePassword : T.showPassword}
                aria-pressed={showPw}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 p-0.5"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Luật mật khẩu hiện cố định, không biến mất khi gõ như placeholder (WCAG 3.3.2). */}
            <p id="new-password-hint" className="mt-1.5 text-xs text-zinc-400">
              {isA ? 'Mật khẩu tối thiểu 15 ký tự.' : 'Password must be at least 15 characters.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400 theme-light:text-red-900"
            >
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} fullWidth>
            {loading
              ? isA
                ? 'Đang lưu...'
                : 'Saving...'
              : isA
                ? 'Đặt mật khẩu mới'
                : 'Set new password'}
          </Button>
        </form>
      </div>
    </main>
  )
}
