// AccountDataSection — "Dữ liệu & tài khoản" ở trang cá nhân: Tải dữ liệu của tôi + Xoá tài khoản.
// Đặc tả: docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md (changelog 0533).
//
// Hai luật giao diện:
//   1. Cả xuất lẫn xoá đều XÁC MINH LẠI ngay trong thao tác (mật khẩu hoặc Google, + mã 2FA nếu
//      bật). Server mới là nơi kiểm thật; client chỉ dẫn người dùng nhập đúng thứ cần.
//   2. Bản xuất chỉ được TẢI VỀ — giao diện không đọc/hiển thị nội dung (Luật số 1: hồ sơ năng lực
//      ẩn không bao giờ hiện lên màn hình).

import { useId, useState } from 'react'
import { buttonClass } from '@core/buttonStyles'
import { preloadGoogleIdentity, requestGoogleAccessToken } from '@core/clientAuth'
import {
  DELETE_CONFIRMATION_PHRASES,
  isDeleteConfirmationValid,
  type AccountOptions,
  type Reauth,
  type ReauthMethod,
} from '@dhcb/core-contracts/account'
import {
  AccountApiError,
  deleteMyAccount,
  exportMyData,
  fetchAccountOptions,
} from '../lib/accountApi'
import { useMountedRef } from '../lib/useMountedRef'

const INPUT_CLASS =
  'w-full rounded-xl border border-line-strong bg-surface-raised px-3 py-3 text-base text-content'

type LoadState = { kind: 'idle' | 'loading' | 'error' } | { kind: 'ready'; options: AccountOptions }

/** Giá trị người dùng nhập để xác minh lại — dùng chung cho hai khối. */
interface ReauthDraft {
  method: ReauthMethod
  password: string
  twoFactorCode: string
}

function errorMessage(err: unknown, isA: boolean): string {
  // Còn đơn thanh toán chờ trả: server từ chối xoá (rà soát 0533). Có bản tiếng Anh riêng vì
  // người học chiều B cần hiểu VÌ SAO chưa xoá được và phải làm gì tiếp.
  if (err instanceof AccountApiError && err.code === 'PAYMENT_PENDING' && !isA) {
    return 'You still have a payment in progress. Please wait until it completes or expires (up to 24 hours after the payment deadline), then try deleting your account again.'
  }
  if (err instanceof Error && err.message) return err.message
  return isA ? 'Có lỗi xảy ra — thử lại sau.' : 'Something went wrong — please retry.'
}

/** Ô xác minh lại: chọn cách (nếu có hai), mật khẩu, mã 2FA. */
function ReauthFields({
  isA,
  idPrefix,
  options,
  draft,
  onChange,
  disabled,
}: {
  isA: boolean
  idPrefix: string
  options: AccountOptions
  draft: ReauthDraft
  onChange: (next: ReauthDraft) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-3">
      {options.methods.length > 1 && (
        <fieldset>
          <legend className="mb-1 text-sm text-content">
            {isA ? 'Xác minh lại bằng' : 'Verify again with'}
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.methods.map((m) => (
              <label
                key={m}
                className="tap-44 flex items-center gap-2 rounded-xl border border-line-strong px-3 text-sm text-content"
              >
                <input
                  type="radio"
                  name={`${idPrefix}-method`}
                  value={m}
                  checked={draft.method === m}
                  onChange={() => onChange({ ...draft, method: m })}
                  disabled={disabled}
                />
                {m === 'password' ? (isA ? 'Mật khẩu' : 'Password') : 'Google'}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {draft.method === 'password' && (
        <div>
          <label htmlFor={`${idPrefix}-password`} className="mb-1 block text-sm text-content">
            {isA ? 'Mật khẩu hiện tại' : 'Current password'}
          </label>
          <input
            id={`${idPrefix}-password`}
            type="password"
            autoComplete="current-password"
            value={draft.password}
            onChange={(e) => onChange({ ...draft, password: e.target.value })}
            disabled={disabled}
            maxLength={200}
            className={INPUT_CLASS}
          />
        </div>
      )}
      {draft.method === 'google' && (
        <p className="text-sm text-content">
          {isA
            ? 'Khi bấm nút bên dưới, cửa sổ Google sẽ mở để bạn xác minh lại tài khoản đã liên kết.'
            : 'When you press the button below, a Google window opens so you can verify your linked account again.'}
        </p>
      )}
      {options.twoFactorRequired && (
        <div>
          <label htmlFor={`${idPrefix}-2fa`} className="mb-1 block text-sm text-content">
            {isA
              ? 'Mã xác thực hai bước (hoặc mã khôi phục)'
              : 'Two-factor code (or recovery code)'}
          </label>
          <input
            id={`${idPrefix}-2fa`}
            inputMode="text"
            autoComplete="one-time-code"
            value={draft.twoFactorCode}
            onChange={(e) => onChange({ ...draft, twoFactorCode: e.target.value })}
            disabled={disabled}
            maxLength={32}
            className={INPUT_CLASS}
          />
        </div>
      )}
    </div>
  )
}

/** Dựng bằng chứng xác minh lại; Google thì mở popup. `null` = người dùng huỷ popup. */
async function buildReauth(draft: ReauthDraft): Promise<Reauth | null> {
  if (draft.method === 'password') return { method: 'password', password: draft.password }
  const accessToken = await requestGoogleAccessToken()
  return accessToken ? { method: 'google', accessToken } : null
}

export default function AccountDataSection({
  isA,
  onDeleted,
}: {
  isA: boolean
  /** Gọi sau khi server xác nhận đã xoá (phiên đã bị huỷ). */
  onDeleted: () => void
}) {
  const uid = useId()
  const mounted = useMountedRef()
  const [open, setOpen] = useState(false)
  const [load, setLoad] = useState<LoadState>({ kind: 'idle' })

  const emptyDraft = (methods: ReauthMethod[]): ReauthDraft => ({
    method: methods[0] ?? 'password',
    password: '',
    twoFactorCode: '',
  })
  const [exportDraft, setExportDraft] = useState<ReauthDraft>(emptyDraft([]))
  const [deleteDraft, setDeleteDraft] = useState<ReauthDraft>(emptyDraft([]))
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportDone, setExportDone] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [ackNoRefund, setAckNoRefund] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function loadOptions() {
    setLoad({ kind: 'loading' })
    try {
      const options = await fetchAccountOptions()
      if (!mounted.current) return
      if (options.methods.includes('google')) preloadGoogleIdentity()
      setExportDraft(emptyDraft(options.methods))
      setDeleteDraft(emptyDraft(options.methods))
      setLoad({ kind: 'ready', options })
    } catch {
      if (mounted.current) setLoad({ kind: 'error' })
    }
  }

  function toggle() {
    if (!open && load.kind !== 'ready') void loadOptions()
    setOpen(!open)
  }

  /** Server nói cần mã 2FA ⇒ hiện ô nhập mà không bắt người dùng tải lại trang. */
  function requireTwoFactor(err: unknown) {
    if (
      err instanceof AccountApiError &&
      err.code === 'STEP_UP_REQUIRED' &&
      load.kind === 'ready'
    ) {
      setLoad({ kind: 'ready', options: { ...load.options, twoFactorRequired: true } })
    }
  }

  function twoFactorMissing(draft: ReauthDraft, options: AccountOptions): boolean {
    return options.twoFactorRequired && draft.twoFactorCode.trim().length < 6
  }

  async function handleExport(event: React.FormEvent, options: AccountOptions) {
    event.preventDefault()
    if (exporting) return
    setExportError('')
    setExportDone('')
    if (exportDraft.method === 'password' && !exportDraft.password) {
      setExportError(isA ? 'Nhập mật khẩu hiện tại.' : 'Enter your current password.')
      return
    }
    if (twoFactorMissing(exportDraft, options)) {
      setExportError(isA ? 'Nhập mã xác thực hai bước.' : 'Enter your two-factor code.')
      return
    }
    setExporting(true)
    try {
      const reauth = await buildReauth(exportDraft)
      if (!reauth) {
        if (mounted.current)
          setExportError(
            isA ? 'Chưa xác minh được với Google.' : 'Google verification was not completed.',
          )
        return
      }
      const filename = await exportMyData({
        reauth,
        ...(exportDraft.twoFactorCode ? { twoFactorCode: exportDraft.twoFactorCode.trim() } : {}),
      })
      if (!mounted.current) return
      setExportDraft({ ...exportDraft, password: '', twoFactorCode: '' })
      setExportDone(isA ? `Đã tải về tệp ${filename}.` : `Downloaded ${filename}.`)
    } catch (err) {
      requireTwoFactor(err)
      if (mounted.current) setExportError(errorMessage(err, isA))
    } finally {
      if (mounted.current) setExporting(false)
    }
  }

  async function handleDelete(event: React.FormEvent, options: AccountOptions) {
    event.preventDefault()
    if (deleting) return
    setDeleteError('')
    if (!isDeleteConfirmationValid(confirmation)) {
      setDeleteError(isA ? 'Câu xác nhận chưa đúng.' : 'The confirmation phrase does not match.')
      return
    }
    if (options.vipActive && !ackNoRefund) {
      setDeleteError(
        isA ? 'Hãy đánh dấu ô xác nhận về gói VIP.' : 'Please tick the VIP confirmation box.',
      )
      return
    }
    if (deleteDraft.method === 'password' && !deleteDraft.password) {
      setDeleteError(isA ? 'Nhập mật khẩu hiện tại.' : 'Enter your current password.')
      return
    }
    if (twoFactorMissing(deleteDraft, options)) {
      setDeleteError(isA ? 'Nhập mã xác thực hai bước.' : 'Enter your two-factor code.')
      return
    }
    setDeleting(true)
    try {
      const reauth = await buildReauth(deleteDraft)
      if (!reauth) {
        if (mounted.current)
          setDeleteError(
            isA ? 'Chưa xác minh được với Google.' : 'Google verification was not completed.',
          )
        return
      }
      await deleteMyAccount({
        reauth,
        confirmation,
        ...(options.vipActive ? { acknowledgeNoRefund: true } : {}),
        ...(deleteDraft.twoFactorCode ? { twoFactorCode: deleteDraft.twoFactorCode.trim() } : {}),
      })
      onDeleted()
    } catch (err) {
      requireTwoFactor(err)
      if (mounted.current) setDeleteError(errorMessage(err, isA))
    } finally {
      if (mounted.current) setDeleting(false)
    }
  }

  const phrase = isA ? DELETE_CONFIRMATION_PHRASES.vi : DELETE_CONFIRMATION_PHRASES.en
  const panelId = `${uid}-panel`

  return (
    <section className="rounded-2xl border border-line-subtle bg-surface-card p-4">
      <h2 className="text-base font-semibold text-content">
        <button
          type="button"
          className="tap-44 w-full text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
        >
          {isA ? 'Dữ liệu & tài khoản' : 'Your data & account'}
        </button>
      </h2>

      {open && (
        <div id={panelId} className="mt-3 space-y-5">
          {load.kind === 'loading' && (
            <p role="status" className="text-sm text-content">
              {isA ? 'Đang tải…' : 'Loading…'}
            </p>
          )}
          {load.kind === 'error' && (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-content">
                {isA
                  ? 'Không tải được thông tin tài khoản. Thử lại nhé.'
                  : 'Could not load your account settings. Please retry.'}
              </p>
              <button
                type="button"
                className={buttonClass({ variant: 'secondary', className: 'tap-44' })}
                onClick={() => void loadOptions()}
              >
                {isA ? 'Thử lại' : 'Retry'}
              </button>
            </div>
          )}

          {load.kind === 'ready' && load.options.methods.length === 0 && (
            <p className="text-sm text-content">
              {isA
                ? 'Tài khoản của bạn đăng nhập bằng một cách chưa hỗ trợ xác minh lại ở đây. Hãy liên hệ hỗ trợ qua mục Góp ý để tải dữ liệu hoặc xoá tài khoản.'
                : 'Your account signs in with a method that cannot be re-verified here. Please contact support via Feedback to download your data or delete your account.'}
            </p>
          )}

          {load.kind === 'ready' && load.options.methods.length > 0 && (
            <>
              {/* ── Tải dữ liệu ── */}
              <form
                className="space-y-3"
                onSubmit={(e) => void handleExport(e, load.options)}
                aria-labelledby={`${uid}-export-title`}
              >
                <h3 id={`${uid}-export-title`} className="text-sm font-semibold text-content">
                  {isA ? 'Tải dữ liệu của tôi' : 'Download my data'}
                </h3>
                <p className="text-sm text-content">
                  {isA
                    ? 'Một tệp JSON gồm mọi dữ liệu Đồng Hành lưu về bạn: hồ sơ, tiến độ học, lịch sử luyện tập, ghi chú, tin nhắn bạn đã gửi, đơn thanh toán… Không gồm mật khẩu hay mã bảo mật.'
                    : 'A JSON file with everything Đồng Hành stores about you: profile, learning progress, practice history, notes, messages you sent, payments… Passwords and security codes are not included.'}
                </p>
                <ReauthFields
                  isA={isA}
                  idPrefix={`${uid}-export`}
                  options={load.options}
                  draft={exportDraft}
                  onChange={setExportDraft}
                  disabled={exporting}
                />
                {exportError && (
                  <p role="alert" className="text-sm text-content">
                    {exportError}
                  </p>
                )}
                {exportDone && (
                  <p role="status" className="text-sm text-content">
                    {exportDone}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={exporting}
                  className={buttonClass({ variant: 'secondary', fullWidth: true })}
                >
                  {exporting
                    ? isA
                      ? 'Đang chuẩn bị tệp…'
                      : 'Preparing file…'
                    : isA
                      ? 'Tải dữ liệu (JSON)'
                      : 'Download data (JSON)'}
                </button>
              </form>

              <hr className="border-line-subtle" />

              {/* ── Xoá tài khoản ── */}
              <form
                className="space-y-3"
                onSubmit={(e) => void handleDelete(e, load.options)}
                aria-labelledby={`${uid}-delete-title`}
              >
                <h3 id={`${uid}-delete-title`} className="text-sm font-semibold text-content">
                  {isA ? 'Xoá tài khoản' : 'Delete account'}
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-content">
                  <li>
                    {isA
                      ? 'Xoá NGAY và VĨNH VIỄN mọi dữ liệu của bạn ở mọi môn học, ghi chú, Bạn Đồng Hành. Không khôi phục được.'
                      : 'Deletes ALL your data across every subject, notes and the Companion IMMEDIATELY and PERMANENTLY. This cannot be undone.'}
                  </li>
                  <li>
                    {isA
                      ? 'Bạn bị đăng xuất khỏi mọi thiết bị.'
                      : 'You will be signed out on every device.'}
                  </li>
                  <li>
                    {isA
                      ? 'Chứng từ thanh toán được giữ lại theo luật kế toán nhưng gỡ hết thông tin nhận ra bạn.'
                      : 'Payment records are kept for accounting law but stripped of anything that identifies you.'}
                  </li>
                  <li>
                    {/* Sổ chống lạm dụng (changelog 0545) — nói thật, không hứa "ẩn danh tuyệt đối". */}
                    {isA
                      ? 'Để chống lạm dụng ưu đãi (dùng thử, mời bạn), chúng tôi giữ mã băm của email và thiết bị trong 12 tháng. Mã băm không chứa email hay tên của bạn, không gắn với tài khoản nào, và chỉ dùng để chặn nhận lại ưu đãi khi đăng ký lại.'
                      : 'To prevent offer abuse (free trial, invites), we keep a hash of your email and device for 12 months. The hash contains no email or name, is not linked to any account, and is only used to stop the same offers being claimed again on sign-up.'}
                  </li>
                  <li>
                    {isA
                      ? 'Tin bạn đã gửi trong cuộc trò chuyện chung được thay bằng "[đã xoá]"; tin của người khác giữ nguyên.'
                      : 'Messages you sent in shared chats are replaced with "[deleted]"; other people’s messages stay.'}
                  </li>
                  <li>
                    {isA
                      ? 'Nên tải dữ liệu về trước nếu muốn giữ lại.'
                      : 'Download your data first if you want to keep it.'}
                  </li>
                </ul>

                {load.options.vipActive && (
                  <div className="space-y-2 rounded-xl border border-line-strong p-3">
                    <p className="text-sm font-semibold text-content">
                      {isA ? 'Gói VIP còn hạn' : 'Your VIP plan is still active'}
                      {load.options.planExpiresAt
                        ? ` (${isA ? 'tới' : 'until'} ${new Date(load.options.planExpiresAt).toLocaleDateString(isA ? 'vi-VN' : 'en-GB')})`
                        : isA
                          ? ' (vĩnh viễn)'
                          : ' (lifetime)'}
                    </p>
                    <p className="text-sm text-content">
                      {isA
                        ? 'Xoá tài khoản sẽ mất phần gói VIP còn lại và KHÔNG được hoàn tiền.'
                        : 'Deleting your account forfeits the remaining VIP time and is NOT refunded.'}
                    </p>
                    <label className="tap-44 flex items-center gap-3 text-sm text-content">
                      <input
                        type="checkbox"
                        checked={ackNoRefund}
                        onChange={(e) => setAckNoRefund(e.target.checked)}
                        disabled={deleting}
                        className="h-5 w-5 shrink-0"
                      />
                      {isA
                        ? 'Tôi hiểu gói VIP còn lại sẽ mất và không hoàn tiền.'
                        : 'I understand the remaining VIP time is lost and not refunded.'}
                    </label>
                  </div>
                )}

                <ReauthFields
                  isA={isA}
                  idPrefix={`${uid}-delete`}
                  options={load.options}
                  draft={deleteDraft}
                  onChange={setDeleteDraft}
                  disabled={deleting}
                />

                <div>
                  <label htmlFor={`${uid}-confirm`} className="mb-1 block text-sm text-content">
                    {isA ? 'Gõ ' : 'Type '}
                    <strong className="font-semibold">{phrase}</strong>
                    {isA ? ' để xác nhận' : ' to confirm'}
                  </label>
                  <input
                    id={`${uid}-confirm`}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    disabled={deleting}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={100}
                    className={INPUT_CLASS}
                  />
                </div>

                {deleteError && (
                  <p role="alert" className="text-sm text-content">
                    {deleteError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    deleting ||
                    !isDeleteConfirmationValid(confirmation) ||
                    (load.options.vipActive && !ackNoRefund)
                  }
                  className={buttonClass({ variant: 'danger', fullWidth: true })}
                >
                  {deleting
                    ? isA
                      ? 'Đang xoá…'
                      : 'Deleting…'
                    : isA
                      ? 'Xoá vĩnh viễn tài khoản'
                      : 'Permanently delete account'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  )
}
