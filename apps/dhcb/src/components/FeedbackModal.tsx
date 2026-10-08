// apps/dhcb/src/components/FeedbackModal.tsx — Hộp thoại Tiếp nhận Ý kiến Đóng góp & Phản hồi Người dùng
import { useState } from 'react'
import { X, Send, Loader2, Star, MessageSquareHeart, CheckCircle2, HelpCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLang } from '../context/useLang'
import { useToast } from '@core/ToastProvider'
import { submitFeedback } from '../lib/feedbackApi'
import { thongDiepLoiThanThien } from '../lib/friendlyError'
import { CATEGORY_METADATA, type UserFeedbackCategory } from '@dhcb/core-contracts/feedback'
import { useDialogBehavior } from './useDialogBehavior'
import { buttonClass } from '@core/buttonStyles'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialCategory?: UserFeedbackCategory
}

export default function FeedbackModal({ isOpen, onClose, initialCategory = 'feature' }: Props) {
  const { user } = useAuth()
  const { lang } = useLang()
  const isA = lang === 'vi'
  const toast = useToast()

  const [category, setCategory] = useState<UserFeedbackCategory>(initialCategory)
  const [rating, setRating] = useState<number>(5)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Điền sẵn email khi thông tin user tới — mẫu "so sánh prev trong render"
  // (React cho phép setState có điều kiện ngay trong render để dẫn xuất từ prop,
  // thay cho setState đồng bộ trong effect trước đây).
  const [prevUserEmail, setPrevUserEmail] = useState(user?.email)
  if (user?.email !== prevUserEmail) {
    setPrevUserEmail(user?.email)
    if (user?.email) setEmail(user.email)
  }

  // Reset form mỗi lần mở modal (hoặc đổi initialCategory khi đang mở) — cùng mẫu trên.
  const [prevOpenKey, setPrevOpenKey] = useState(`${isOpen}|${initialCategory}`)
  const openKey = `${isOpen}|${initialCategory}`
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey)
    if (isOpen) {
      setSuccess(false)
      setMessage('')
      setTitle('')
      setCategory(initialCategory)
    }
  }

  // Trước đây chỉ có role/aria-modal; hook bổ sung Escape, bẫy tiêu điểm, trả tiêu
  // điểm khi đóng và khoá cuộn nền.
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose, isOpen)

  if (!isOpen) return null

  const categories: UserFeedbackCategory[] = ['feature', 'bug', 'content', 'ui_ux', 'other']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 3) {
      toast.error(
        isA
          ? 'Vui lòng nhập nội dung góp ý tối thiểu 3 ký tự'
          : 'Please enter at least 3 characters',
      )
      return
    }

    setSubmitting(true)
    const contextInfo = {
      currentUrl: window.location.href,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      appVersion: '7.2.0',
    }

    const res = await submitFeedback({
      category,
      rating,
      title: title.trim() || undefined,
      message: message.trim(),
      contactEmail: email.trim() || undefined,
      contextInfo,
    })

    setSubmitting(false)
    if (res.ok) {
      setSuccess(true)
      toast.success(
        isA
          ? 'Gửi ý kiến đóng góp thành công! Cảm ơn bạn ❤️'
          : 'Feedback submitted successfully! Thank you ❤️',
      )
    } else {
      // Lỗi mạng/HTTP thô ("Failed to fetch", "HTTP 500") đổi thành câu đọc được theo chiều học.
      toast.error(
        thongDiepLoiThanThien(
          res.error,
          isA
            ? 'Chưa gửi được ý kiến, thử lại sau.'
            : 'Could not send your feedback, try again later.',
          isA ? 'vi' : 'en',
        ),
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90dvh] overflow-y-auto animate-scale-up focus:outline-none"
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          disabled={submitting}
          aria-label={isA ? 'Đóng' : 'Close'}
          className="tap-44 absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 theme-light:text-emerald-900">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 id={titleId} className="text-lg font-bold text-white">
                {isA ? 'Đã tiếp nhận ý kiến của bạn!' : 'Feedback Received!'}
              </h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                {isA
                  ? 'Mỗi đóng góp từ bạn là động lực to lớn giúp Đồng Hành AI ngày càng hoàn thiện và hữu ích hơn.'
                  : 'Every contribution from you helps make Dong Hanh AI more helpful every day.'}
              </p>
            </div>
            <button type="button" onClick={onClose} className={buttonClass()}>
              {isA ? 'Hoàn tất' : 'Done'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-400 shrink-0">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 id={titleId} className="text-base font-bold text-white">
                  {isA ? 'Góp Ý & Báo Lỗi' : 'Feedback & Suggestions'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isA
                    ? 'Chia sẻ ý tưởng, báo lỗi hoặc cảm nhận của bạn'
                    : 'Share your thoughts, report bugs, or request features'}
                </p>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                {isA ? 'Loại phản hồi' : 'Feedback Category'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const meta = CATEGORY_METADATA[cat]
                  const isSelected = category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`tap-44 px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition ${
                        isSelected
                          ? 'bg-accent-500/15 border-accent-500/60 text-accent-300 shadow-sm shadow-accent-500/10'
                          : 'bg-zinc-800/60 border-zinc-700/70 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-base leading-none">{meta.icon}</span>
                      <span className="truncate">{isA ? meta.labelVi : meta.labelEn}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rating Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>{isA ? 'Mức độ hài lòng chung' : 'Overall Satisfaction'}</span>
                <span className="text-accent-400 font-bold text-xs">{rating}/5 ⭐</span>
              </label>
              <div className="flex items-center justify-between gap-1 p-2 bg-zinc-950/60 rounded-xl border border-zinc-800">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="tap-44 flex-1 flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-zinc-800/60 transition group"
                  >
                    <Star
                      className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                        star <= rating
                          ? 'text-amber-400 theme-light:text-amber-900 fill-amber-400'
                          : 'text-content-muted group-hover:text-zinc-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title (Optional) */}
            <div className="space-y-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isA ? 'Tiêu đề ngắn gọn (tùy chọn)...' : 'Brief title (optional)...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500/50"
              />
            </div>

            {/* Message Area */}
            <div className="space-y-1">
              <div className="relative">
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? isA
                        ? 'Mô tả chi tiết lỗi bạn gặp phải (bước thực hiện, hiện tượng lạ...)'
                        : 'Describe the bug in detail...'
                      : isA
                        ? 'Nội dung chi tiết góp ý hoặc ý tưởng tính năng mới của bạn...'
                        : 'Your detailed suggestions, ideas, or feedback...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500/50 resize-none"
                />
                <span className="absolute bottom-2 right-3 text-[0.6875rem] text-zinc-500">
                  {message.length}/10000
                </span>
              </div>
            </div>

            {/* Contact Email */}
            <div className="space-y-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  isA
                    ? 'Email liên hệ nhận phản hồi (nếu có)...'
                    : 'Contact email for updates (optional)...'
                }
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500/50"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[0.6875rem] text-zinc-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                {isA ? 'Ghi nhận tự động context' : 'Auto context included'}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="tap-44 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                >
                  {isA ? 'Huỷ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={buttonClass({ size: 'sm', className: 'tap-44' })}
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {isA ? 'Gửi đóng góp' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
