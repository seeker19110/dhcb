import { useEffect, useState } from 'react'
import { X, Share2, Copy, Check, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import { getStreak } from '../lib/storage'
import { getLearnedCount } from '../lib/vocab'
import { useDialogBehavior } from './useDialogBehavior'

interface Props {
  userId: string
  isA: boolean
  onClose: () => void
}

// Modal chia sẻ tiến độ học tập — dùng Web Share API, copy text, hoặc mã QR để người khác quét
export default function ShareProgress({ userId, isA, onClose }: Props) {
  const streak = getStreak(userId)
  const learned = getLearnedCount(userId)
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  // 6 hành vi a11y bắt buộc của hộp thoại.
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose)

  const shareLink = window.location.origin

  const shareText = isA
    ? `🇻🇳→🇺🇸 Tôi đang học tiếng Anh với AI Gia sư!\n📚 Đã học: ${learned} từ\n🔥 Chuỗi học: ${streak} ngày liên tiếp\n👉 ${shareLink}`
    : `🇺🇸→🇻🇳 I'm learning Vietnamese with AI Tutor!\n📚 Words learned: ${learned}\n🔥 Streak: ${streak} days\n👉 ${shareLink}`

  // Chỉ tạo QR khi người dùng mở tab QR — tránh tốn công vẽ nếu họ không cần.
  useEffect(() => {
    if (!showQr || qrDataUrl) return
    QRCode.toDataURL(shareLink, { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => {})
  }, [showQr, qrDataUrl, shareLink])

  async function doShare() {
    if (navigator.share) {
      await navigator.share({ text: shareText }).catch(() => {})
    } else {
      copyText()
    }
  }

  function copyText() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const statCards = [
    {
      emoji: '📚',
      value: learned,
      label: isA ? 'từ đã học' : 'words learned',
      color: 'text-accent-400',
    },
    {
      emoji: '🔥',
      value: streak,
      label: isA ? 'ngày streak' : 'day streak',
      color: 'text-orange-400 theme-light:text-orange-900',
    },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl max-h-[90dvh] overflow-y-auto focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="text-lg font-bold text-white">
            {isA ? 'Chia sẻ tiến độ' : 'Share Progress'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={isA ? 'Đóng' : 'Close'}
            className="tap-44 shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Card xem trước */}
        {!showQr && (
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-5 mb-5 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎓</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {isA ? 'AI Gia sư tiếng Anh' : 'AI Vietnamese Tutor'}
                </p>
                <p className="text-xs text-zinc-400">{window.location.hostname}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {statCards.map((s) => (
                <div key={s.label} className="bg-zinc-900/60 rounded-xl p-3 text-center">
                  <p className="text-2xl">{s.emoji}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-[0.6875rem] text-zinc-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-400 text-center mt-3">
              {isA ? 'Học tiếng Anh mỗi ngày' : 'Learning Vietnamese every day'} 💪
            </p>
          </div>
        )}

        {/* Mã QR — người khác quét bằng camera điện thoại là vào thẳng app, không cần gõ link */}
        {showQr && (
          <div className="bg-zinc-800/60 rounded-2xl p-5 mb-5 border border-zinc-700/50 flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={isA ? 'Mã QR truy cập app' : 'QR code to access the app'}
                className="w-[180px] h-[180px] rounded-lg bg-white p-2"
              />
            ) : (
              <div className="w-[180px] h-[180px] rounded-lg bg-zinc-900/60 animate-pulse" />
            )}
            <p className="text-xs text-zinc-400 mt-3 text-center">{shareLink}</p>
            <p className="text-xs text-zinc-500 text-center mt-1">
              {isA
                ? 'Quét bằng camera điện thoại để mở app'
                : 'Scan with your phone camera to open the app'}
            </p>
          </div>
        )}

        {/* Nút chuyển Thẻ / QR */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowQr(false)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
              !showQr ? 'bg-zinc-700 text-white' : 'bg-zinc-800/60 text-zinc-400'
            }`}
          >
            {isA ? 'Thẻ tiến độ' : 'Progress card'}
          </button>
          <button
            onClick={() => setShowQr(true)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition ${
              showQr ? 'bg-zinc-700 text-white' : 'bg-zinc-800/60 text-zinc-400'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {isA ? 'Mã QR' : 'QR code'}
          </button>
        </div>

        {/* Nút hành động */}
        <div className="flex gap-3">
          <button
            onClick={copyText}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
          >
            {copied ? <Check className="w-4 h-4 text-accent-400" /> : <Copy className="w-4 h-4" />}
            {copied ? (isA ? 'Đã sao chép!' : 'Copied!') : isA ? 'Sao chép' : 'Copy'}
          </button>
          {'share' in navigator && (
            <button
              onClick={doShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-black text-sm font-semibold transition"
            >
              <Share2 className="w-4 h-4" />
              {isA ? 'Chia sẻ' : 'Share'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
