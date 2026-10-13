// CompanionDailyCards — "Thẻ hôm nay" đứng đầu studio "Kế hoạch" của Bạn Đồng Hành.
//
// Đặc tả: docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md (changelog 0629).
//
// Thay nhắc nhở giả lập cũ ("năng lượng nhận thức 85%" cho mọi người, lộ trình AutoPilot 4 bước gõ
// sẵn). Mỗi thẻ do server dựng từ dữ liệu THẬT (thẻ ôn đến hạn, việc đến hạn, mục tiêu học, lời mời
// phản tỉnh), tối đa 3 thẻ/ngày, tự chuyển "Đã xong" khi việc được làm. 👍/👎 lưu thành sở thích:
// 👎 tắt loại thẻ đó 7 ngày. Đủ ba trạng thái: đang tải · lỗi (LoadError + Thử lại) · rỗng (nói thật).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Sun, ThumbsDown, ThumbsUp } from 'lucide-react'
import type {
  CompanionDailyCard,
  DailyCardFeedback,
} from '@dhcb/core-contracts/companionDailyCards'
import { buttonClass } from '@core/buttonStyles'
import LoadError from '../LoadError'
import { Skeleton } from '../Skeleton'
import { useAsyncLoad } from '../../lib/useAsyncLoad'
import { fetchCompanionDailyCards, sendCompanionCardFeedback } from '../../lib/companionCardsApi'

const HEADING_ID = 'companion-daily-cards-heading'

const FEEDBACK_NOTE: Record<DailyCardFeedback, string> = {
  up: 'Cảm ơn bạn — mình sẽ ưu tiên loại thẻ này.',
  down: 'Đã ghi nhận — 7 ngày tới mình sẽ không gợi ý loại thẻ này.',
}

function KhungCho() {
  return (
    <div aria-busy="true" className="space-y-3">
      <p className="sr-only">Đang tải thẻ hôm nay…</p>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  )
}

function feedbackButtonClass(active: boolean): string {
  return [
    'tap-44 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
    active
      ? 'border-accent-500 bg-accent-500/15 text-content'
      : 'border-line-subtle text-content-secondary hover:border-line-strong hover:text-content',
  ].join(' ')
}

function TheMot({ card }: { card: CompanionDailyCard }) {
  const [feedback, setFeedback] = useState<DailyCardFeedback | null>(card.feedback)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const done = card.status === 'done'
  const titleId = `daily-card-${card.id}`

  async function guiPhanHoi(next: DailyCardFeedback) {
    if (saving || next === feedback) return
    const previous = feedback
    setFeedback(next)
    setSaving(true)
    setError(null)
    try {
      await sendCompanionCardFeedback(card.id, next)
    } catch {
      setFeedback(previous)
      setError('Chưa lưu được phản hồi — thử lại sau.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li
      aria-labelledby={titleId}
      data-testid="daily-card"
      data-kind={card.kind}
      className="space-y-3 rounded-2xl border border-line-subtle bg-surface-base/60 p-3.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h4 id={titleId} className="text-sm font-bold text-content">
          {card.title}
        </h4>
        {done && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300 theme-light:text-emerald-900">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            Đã xong
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-content-secondary">{card.body}</p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={card.route}
          className={buttonClass({
            variant: done ? 'secondary' : 'primary',
            size: 'sm',
            className: 'tap-44 w-full sm:w-auto',
          })}
        >
          <span>{card.actionLabel}</span>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <div
          role="group"
          aria-label={`Thẻ "${card.title}" có hữu ích không?`}
          className="flex gap-2"
        >
          <button
            type="button"
            aria-pressed={feedback === 'up'}
            disabled={saving}
            onClick={() => void guiPhanHoi('up')}
            className={feedbackButtonClass(feedback === 'up')}
          >
            <ThumbsUp aria-hidden="true" className="h-4 w-4" />
            Hữu ích
          </button>
          <button
            type="button"
            aria-pressed={feedback === 'down'}
            disabled={saving}
            onClick={() => void guiPhanHoi('down')}
            className={feedbackButtonClass(feedback === 'down')}
          >
            <ThumbsDown aria-hidden="true" className="h-4 w-4" />
            Không hữu ích
          </button>
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-content-secondary empty:hidden">
        {error ?? (feedback ? FEEDBACK_NOTE[feedback] : '')}
      </p>
    </li>
  )
}

export default function CompanionDailyCards() {
  const { state, retry } = useAsyncLoad(fetchCompanionDailyCards, {
    errorMessage: 'Chưa tải được thẻ hôm nay — thử lại sau.',
  })

  return (
    <section
      data-testid="companion-daily-cards"
      aria-labelledby={HEADING_ID}
      className="space-y-4 rounded-3xl border border-line-subtle bg-surface-card p-4 shadow-xl sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent-500/30 bg-accent-500/15 text-accent-300 theme-light:text-accent-800">
          <Sun aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 id={HEADING_ID} className="text-base font-bold text-content">
            Thẻ hôm nay
          </h3>
          <p className="text-sm text-content-secondary">
            Tối đa 3 việc nên làm hôm nay, dựng từ dữ liệu học và Ghi chú của bạn.
          </p>
        </div>
      </div>

      {state.status === 'loading' && <KhungCho />}
      {state.status === 'error' && (
        <LoadError
          message={state.message}
          onRetry={retry}
          hint="Thẻ chỉ đọc dữ liệu của bạn — không có gì bị thay đổi."
        />
      )}
      {state.status === 'ready' && state.data.cards.length === 0 && (
        <p className="text-sm leading-relaxed text-content-secondary">
          Hôm nay chưa có thẻ nào: không có thẻ ôn hay việc đến hạn, và chưa có mục tiêu học cần
          nhắc. Bạn có thể trò chuyện với Bạn Đồng Hành để đặt mục tiêu học.
        </p>
      )}
      {state.status === 'ready' && state.data.cards.length > 0 && (
        <ul className="space-y-3">
          {state.data.cards.map((card) => (
            <TheMot key={card.id} card={card} />
          ))}
        </ul>
      )}
    </section>
  )
}
