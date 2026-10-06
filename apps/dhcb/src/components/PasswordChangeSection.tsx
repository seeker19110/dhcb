import { useState } from 'react'
import { isValidNewPassword } from '@core/clientAuth'
import { buttonClass } from '@core/buttonStyles'
import { changeAccountPassword, fetchPasswordStatus } from '../lib/passwordApi'
import { useMountedRef } from '../lib/useMountedRef'

export default function PasswordChangeSection({
  isA,
  onChanged,
}: {
  isA: boolean
  onChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'password' | 'oauth' | 'error'>('idle')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const mounted = useMountedRef()
  const inputClass =
    'w-full rounded-xl border border-line-strong bg-surface-raised px-3 py-3 text-base text-content'

  function clearFields() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmation('')
    setShow(false)
  }

  async function loadStatus() {
    setStatus('loading')
    setError('')
    try {
      const hasPassword = await fetchPasswordStatus()
      if (mounted.current) setStatus(hasPassword ? 'password' : 'oauth')
    } catch {
      if (mounted.current) {
        setStatus('error')
        setError(
          isA
            ? 'Không tải được thông tin bảo mật. Thử lại nhé.'
            : 'Could not load security settings. Please retry.',
        )
      }
    }
  }

  function toggle() {
    if (open) {
      clearFields()
      setError('')
    } else {
      void loadStatus()
    }
    setOpen(!open)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    setError('')
    if (!currentPassword) {
      setError(isA ? 'Nhập mật khẩu hiện tại.' : 'Enter your current password.')
      return
    }
    if (!isValidNewPassword(newPassword)) {
      setError(
        isA
          ? 'Mật khẩu mới tối thiểu 15 ký tự, tối đa 72 byte UTF-8.'
          : 'Use at least 15 characters and at most 72 UTF-8 bytes.',
      )
      return
    }
    if (newPassword !== confirmation) {
      setError(isA ? 'Hai lần nhập mật khẩu mới chưa khớp.' : 'The new passwords do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError(
        isA
          ? 'Mật khẩu mới phải khác mật khẩu hiện tại.'
          : 'Choose a password different from your current one.',
      )
      return
    }
    setSaving(true)
    try {
      await changeAccountPassword(currentPassword, newPassword)
    } catch (err) {
      if (mounted.current) {
        setSaving(false)
        setError(
          err instanceof Error
            ? err.message
            : isA
              ? 'Chưa đổi được mật khẩu. Thử lại sau.'
              : 'Could not change your password. Please retry.',
        )
      }
      return
    }
    if (!mounted.current) return
    clearFields()
    setSaving(false)
    onChanged()
  }

  return (
    <section className="rounded-2xl border border-line-subtle bg-surface-card p-4">
      <h2 className="text-base font-semibold text-content">
        <button
          type="button"
          className="tap-44 w-full text-left"
          aria-expanded={open}
          aria-controls="password-change-panel"
          disabled={saving || status === 'loading'}
          onClick={toggle}
        >
          {isA ? 'Đổi mật khẩu' : 'Change password'}
        </button>
      </h2>
      {open && (
        <div id="password-change-panel" className="mt-3 space-y-3">
          {status === 'loading' && (
            <p role="status" className="text-sm text-content">
              {isA ? 'Đang kiểm tra…' : 'Checking…'}
            </p>
          )}
          {status === 'oauth' && (
            <p className="text-sm text-content">
              {isA
                ? 'Tài khoản dùng đăng nhập liên kết chưa có mật khẩu riêng tại Đồng Hành. Hãy đổi mật khẩu ở nhà cung cấp đăng nhập bạn đang sử dụng.'
                : 'This account uses a linked sign-in provider and has no local password. Manage your password with your sign-in provider.'}
            </p>
          )}
          {error && (
            <p id="password-change-error" role="alert" className="text-sm text-content">
              {error}
            </p>
          )}
          {status === 'error' && (
            <button
              type="button"
              className={buttonClass({ variant: 'secondary' })}
              onClick={() => void loadStatus()}
            >
              {isA ? 'Thử lại' : 'Retry'}
            </button>
          )}
          {status === 'password' && (
            <form onSubmit={submit} className="space-y-3" aria-describedby="password-change-help">
              <p id="password-change-help" className="text-sm text-content">
                {isA
                  ? 'Mật khẩu mới tối thiểu 15 ký tự, tối đa 72 byte UTF-8. Sau khi đổi, tất cả phiên cũ sẽ đăng xuất. Bạn cần đăng nhập lại.'
                  : 'Use at least 15 characters, at most 72 UTF-8 bytes. Changing your password signs out all existing sessions. You will need to sign in again.'}
              </p>
              <div>
                <label htmlFor="password-current" className="mb-1 block text-sm text-content">
                  {isA ? 'Mật khẩu hiện tại' : 'Current password'}
                </label>
                <input
                  id="password-current"
                  name="currentPassword"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={saving}
                  required
                  maxLength={200}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="password-new" className="mb-1 block text-sm text-content">
                  {isA ? 'Mật khẩu mới' : 'New password'}
                </label>
                <input
                  id="password-new"
                  name="newPassword"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={saving}
                  required
                  maxLength={144}
                  aria-describedby="password-change-help"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="password-confirm" className="mb-1 block text-sm text-content">
                  {isA ? 'Nhập lại mật khẩu mới' : 'Confirm new password'}
                </label>
                <input
                  id="password-confirm"
                  name="confirmPassword"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={saving}
                  required
                  maxLength={144}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                className="tap-44 text-sm text-content underline"
                aria-pressed={show}
                onClick={() => setShow(!show)}
                disabled={saving}
              >
                {show
                  ? isA
                    ? 'Ẩn mật khẩu'
                    : 'Hide passwords'
                  : isA
                    ? 'Hiện mật khẩu'
                    : 'Show passwords'}
              </button>
              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className={buttonClass({ variant: 'primary', fullWidth: true })}
                >
                  {saving
                    ? isA
                      ? 'Đang lưu…'
                      : 'Saving…'
                    : isA
                      ? 'Lưu mật khẩu mới'
                      : 'Save new password'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  )
}
