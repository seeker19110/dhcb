// src/components/TwoFactorSection.tsx — Khối "Xác thực hai bước" trong trang Hồ sơ.
//
// 2FA là TUỲ CHỌN (xem migration 0060): bắt buộc sẽ chặn học sinh 10–18 chưa có điện thoại riêng,
// vốn là nhóm người dùng trọng tâm. Khối này chỉ mời, không ép, và không hiện cảnh báo doạ dẫm khi
// người dùng chưa bật.
//
// Luồng bật là HAI bước có chủ ý: quét QR → nhập mã xác nhận. Bật ngay lúc sinh secret sẽ khiến
// người quét hỏng tự khoá mình ra khỏi tài khoản mà không hề biết.

import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { ShieldCheck, ShieldOff, Loader2, Copy, Check, KeyRound, ChevronDown } from 'lucide-react'
import { Button } from '@core/Button'
import { useToast } from '@core/ToastProvider'
import {
  fetchTwoFactorStatus,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateRecoveryCodes,
  verifyTwoFactor,
  type TwoFactorStatus,
} from '../lib/twoFactorApi'
import { buttonClass } from '@core/buttonStyles'

type Step = 'idle' | 'scanning' | 'codes'

export default function TwoFactorSection({ isA }: { isA: boolean }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [step, setStep] = useState<Step>('idle')
  const [secret, setSecret] = useState('')
  const [otpauthUri, setOtpauthUri] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDisable, setShowDisable] = useState(false)

  const refresh = useCallback(async () => {
    const r = await fetchTwoFactorStatus()
    if (r.ok) setStatus(r.data)
  }, [])

  // Nạp trạng thái 2FA lúc mount — hàm async định nghĩa TRONG effect, setState
  // nằm sau await (không setState đồng bộ trong thân effect). `refresh` ở trên
  // vẫn dùng cho các handler bật/tắt 2FA.
  useEffect(() => {
    const init = async () => {
      const r = await fetchTwoFactorStatus()
      if (r.ok) setStatus(r.data)
    }
    void init()
  }, [])

  // Dựng QR từ chuỗi otpauth. Lỗi thì bỏ qua — vẫn còn đường gõ tay secret bên dưới.
  useEffect(() => {
    if (step !== 'scanning' || !otpauthUri) return
    let cancelled = false
    QRCode.toDataURL(otpauthUri, { width: 200, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [step, otpauthUri])

  async function handleStart() {
    setBusy(true)
    const r = await startTwoFactorSetup()
    setBusy(false)
    if (!r.ok) {
      toast.error(r.error)
      return
    }
    setSecret(r.data.secret)
    setOtpauthUri(r.data.otpauthUri)
    setCode('')
    setStep('scanning')
  }

  async function handleConfirm() {
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error(isA ? 'Mã gồm 6 chữ số' : 'The code has 6 digits')
      return
    }
    setBusy(true)
    const r = await confirmTwoFactorSetup(code.trim())
    setBusy(false)
    if (!r.ok) {
      toast.error(r.error)
      return
    }
    setRecoveryCodes(r.data.recoveryCodes)
    setStep('codes')
    setCode('')
    setSecret('')
    void refresh()
    toast.success(isA ? 'Đã bật xác thực hai bước' : 'Two-factor authentication is on')
  }

  async function handleDisable() {
    setBusy(true)
    const r = await disableTwoFactor(code.trim(), password)
    setBusy(false)
    if (!r.ok) {
      toast.error(r.error)
      return
    }
    setCode('')
    setPassword('')
    setShowDisable(false)
    setStep('idle')
    void refresh()
    toast.success(isA ? 'Đã tắt xác thực hai bước' : 'Two-factor authentication is off')
  }

  async function handleVerify() {
    if (!code.trim()) return
    setBusy(true)
    const result = await verifyTwoFactor(code.trim())
    setBusy(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setCode('')
    void refresh()
    toast.success(
      isA
        ? 'Đã xác minh. Bạn có thể xem và xuất dữ liệu riêng tư trong 15 phút.'
        : 'Verified. You can view and export private data for 15 minutes.',
    )
  }

  async function handleRegenerate() {
    if (!code.trim()) {
      toast.error(isA ? 'Nhập mã từ ứng dụng xác thực' : 'Enter the code from your authenticator')
      return
    }
    setBusy(true)
    const r = await regenerateRecoveryCodes(code.trim())
    setBusy(false)
    if (!r.ok) {
      toast.error(r.error)
      return
    }
    setRecoveryCodes(r.data.recoveryCodes)
    setStep('codes')
    setCode('')
    void refresh()
  }

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(isA ? 'Không sao chép được' : 'Could not copy')
    }
  }

  const enabled = status?.enabled ?? false

  return (
    <section
      id="two-factor-section"
      className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap-44 w-full flex items-center justify-between gap-3 text-left rounded-xl hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center shrink-0">
            {enabled ? (
              <ShieldCheck className="w-5 h-5 text-accent-400" />
            ) : (
              <ShieldOff className="w-5 h-5 text-zinc-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {isA ? 'Xác thực hai bước' : 'Two-factor authentication'}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {enabled
                ? isA
                  ? `Đang bật · còn ${status?.recoveryCodesLeft ?? 0} mã khôi phục`
                  : `On · ${status?.recoveryCodesLeft ?? 0} recovery codes left`
                : isA
                  ? 'Chưa bật · tuỳ chọn, không bắt buộc'
                  : 'Off · optional, not required'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3">
          <p className="text-xs text-zinc-300">
            {isA
              ? 'Thêm một lớp khoá cho tài khoản: ngoài mật khẩu, cần thêm mã 6 số từ ứng dụng xác thực trên điện thoại. Bạn vẫn học và trò chuyện bình thường mà không cần bật.'
              : 'Adds a second lock to your account: besides your password, a 6-digit code from an authenticator app. You can keep learning and chatting without it.'}
          </p>

          {/* ── Bước 1: quét QR ─────────────────────────────────────────── */}
          {step === 'scanning' && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-3">
              <p className="text-xs text-zinc-300">
                {isA
                  ? '1. Mở ứng dụng xác thực (Google Authenticator, Authy…) và quét mã này:'
                  : '1. Open your authenticator app (Google Authenticator, Authy…) and scan this:'}
              </p>
              {qrDataUrl && (
                /* Nền TRẮNG THẬT (#fff) là bắt buộc để camera quét được QR — token
                   --c-white bị đảo thành màu tối ở theme nền sáng nên KHÔNG dùng được. */
                <img
                  src={qrDataUrl}
                  width={200}
                  height={200}
                  className="mx-auto rounded-lg bg-[#fff] p-2"
                  alt={
                    isA
                      ? 'Mã QR để thêm tài khoản vào ứng dụng xác thực'
                      : 'QR code to add this account to your authenticator app'
                  }
                />
              )}
              <p className="text-xs text-zinc-400">
                {isA ? 'Không quét được? Gõ tay mã này:' : "Can't scan? Type this key instead:"}
              </p>
              <code className="block text-xs font-mono text-zinc-200 bg-zinc-900 rounded-lg p-2 break-all select-all">
                {secret}
              </code>

              <label htmlFor="tfa-confirm" className="block text-xs text-zinc-300">
                {isA
                  ? '2. Nhập mã 6 số ứng dụng đang hiện:'
                  : '2. Enter the 6-digit code it shows:'}
              </label>
              <div className="flex gap-2">
                <input
                  id="tfa-confirm"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="flex-1 min-w-0 tap-44 rounded-xl bg-zinc-900 border border-zinc-700 px-3 text-base text-white placeholder:text-zinc-500 tracking-widest"
                />
                <Button
                  onClick={() => void handleConfirm()}
                  loading={busy}
                  loadingLabel={isA ? 'Đang xử lý' : 'Working'}
                >
                  {isA ? 'Xác nhận' : 'Confirm'}
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setStep('idle')}
                className="tap-44 text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
              >
                {isA ? 'Huỷ' : 'Cancel'}
              </button>
            </div>
          )}

          {/* ── Mã khôi phục: chỉ hiện ĐÚNG MỘT LẦN ──────────────────────── */}
          {step === 'codes' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                <h3 className="text-sm font-semibold text-amber-100 theme-light:text-amber-900">
                  {isA ? 'Mã khôi phục — lưu lại ngay' : 'Recovery codes — save them now'}
                </h3>
              </div>
              <p className="text-xs text-amber-200/90 theme-light:text-amber-800">
                {isA
                  ? 'Đây là lần DUY NHẤT bạn thấy các mã này. Mất điện thoại thì chúng là đường vào tài khoản còn lại — in ra giấy hoặc lưu vào trình quản lý mật khẩu. Mỗi mã dùng được một lần.'
                  : 'This is the ONLY time you will see these. If you lose your phone they are your way back in — print them or save them to a password manager. Each code works once.'}
              </p>
              <ul className="grid grid-cols-2 gap-1.5 font-mono text-xs text-amber-100 theme-light:text-amber-900">
                {recoveryCodes.map((c) => (
                  <li key={c} className="bg-black/15 rounded px-2 py-1 select-all">
                    {c}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void copyCodes()}
                  className="tap-44 px-3 rounded-xl border border-amber-500/40 hover:bg-amber-500/15 transition-colors text-xs text-amber-100 theme-light:text-amber-900 flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? (isA ? 'Đã chép' : 'Copied') : isA ? 'Sao chép' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryCodes([])
                    setStep('idle')
                  }}
                  className={buttonClass({ variant: 'primary' })}
                >
                  {isA ? 'Tôi đã lưu xong' : 'I saved them'}
                </button>
              </div>
            </div>
          )}

          {/* ── Trạng thái nghỉ: bật, hoặc quản lý khi đã bật ────────────── */}
          {step === 'idle' && !enabled && (
            <Button
              onClick={() => void handleStart()}
              loading={busy}
              loadingLabel={isA ? 'Đang xử lý' : 'Working'}
              fullWidth
            >
              {isA ? 'Bật xác thực hai bước' : 'Turn on two-factor'}
            </Button>
          )}

          {step === 'idle' && enabled && (
            <div className="space-y-3">
              {status && status.recoveryCodesLeft <= 2 && (
                <p
                  role="status"
                  className="text-xs text-amber-200 theme-light:text-amber-800 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2"
                >
                  {isA
                    ? `Chỉ còn ${status.recoveryCodesLeft} mã khôi phục — nên tạo bộ mới.`
                    : `Only ${status.recoveryCodesLeft} recovery codes left — generate a new set.`}
                </p>
              )}

              <label htmlFor="tfa-manage" className="block text-xs text-zinc-300">
                {isA
                  ? 'Nhập mã từ ứng dụng xác thực (hoặc một mã khôi phục):'
                  : 'Enter a code from your authenticator (or a recovery code):'}
              </label>
              <input
                id="tfa-manage"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full tap-44 rounded-xl bg-zinc-900 border border-zinc-700 px-3 text-base text-white placeholder:text-zinc-500"
              />

              <p className="text-xs text-zinc-300">
                {isA
                  ? 'Xác minh để xem hoặc xuất dữ liệu riêng tư trong 15 phút.'
                  : 'Verify to view or export private data for 15 minutes.'}
              </p>
              <Button
                onClick={() => void handleVerify()}
                disabled={busy || !code.trim()}
                loading={busy}
                fullWidth
              >
                {isA ? 'Xác minh truy cập dữ liệu riêng tư' : 'Verify private data access'}
              </Button>
              <button
                type="button"
                onClick={() => void handleRegenerate()}
                disabled={busy}
                className="tap-44 w-full px-4 rounded-xl border border-zinc-700 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors text-sm text-zinc-200 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {isA ? 'Tạo bộ mã khôi phục mới' : 'Generate new recovery codes'}
              </button>

              {!showDisable ? (
                <button
                  type="button"
                  onClick={() => setShowDisable(true)}
                  className="tap-44 w-full text-xs text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-2"
                >
                  {isA ? 'Tắt xác thực hai bước' : 'Turn off two-factor'}
                </button>
              ) : (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-2">
                  <label
                    htmlFor="tfa-pass"
                    className="block text-xs text-rose-100 theme-light:text-rose-900"
                  >
                    {isA
                      ? 'Nhập thêm mật khẩu để tắt (cần cả hai):'
                      : 'Also enter your password to turn it off (both required):'}
                  </label>
                  <input
                    id="tfa-pass"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full tap-44 rounded-xl bg-zinc-900 border border-zinc-700 px-3 text-base text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDisable()}
                      disabled={busy}
                      // rose-700 chứ không phải rose-500: trắng trên rose-500 chỉ đạt 3,67:1, dưới sàn AA
                      // 4,5:1 (cổng e2e/a11y-2fa.spec.ts bắt được). text-[#fff] cố định vì nền
                      // này KHÔNG đổi theo theme — dùng `text-white` sẽ bị đảo thành màu tối ở
                      // các theme nền sáng (CLAUDE.md mục 4.5).
                      className={buttonClass({ variant: 'danger', className: 'flex-1' })}
                    >
                      {isA ? 'Tắt' : 'Turn off'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisable(false)}
                      className={buttonClass({ variant: 'outline', className: 'flex-1' })}
                    >
                      {isA ? 'Huỷ' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
