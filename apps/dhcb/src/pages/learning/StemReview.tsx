// StemReview — ÔN THẺ của một môn STEM (Toán · Lí · Hoá · Sinh), route `/goc-hoc-tap/:subjectId/on-tap`.
//
// Dùng CHUNG màn lật thẻ với môn Lập trình (`components/FlashcardReview.tsx`, S12-1 AC-6) —
// khác nhau chỉ ở nguồn thẻ và đường mở lại bài.
//
// Thẻ STEM CHỈ tồn tại sau khi học viên hoàn thành bài có bằng chứng (S11). Chưa có thẻ nào là
// chuyện bình thường, và trang phải nói ra điều đó bằng CHỮ chứ không để màn trắng.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom'
import { BookOpen, CheckCircle2, Brain } from 'lucide-react'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import FlashcardReview, { type FlashcardItem } from '../../components/FlashcardReview'
import {
  getDueStemCardsForSubject,
  hydrateStemCards,
  reviewStemCard,
  duongDanBaiCuaThe,
  type StemSrsCard,
  type StemSrsCardRef,
} from '../../lib/stemSrs'
import { docCapTuQuery } from '../../lib/reviewRoutes'
import { getStemSubject, duongDanDanhSachBai, type StemSubject } from '../../lib/stemLessonRoutes'
import { type Rating } from '../../lib/srs'
import { buttonClass } from '@core/buttonStyles'

export default function StemReview() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const subject = getStemSubject(subjectId)
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  usePageTitle(subject ? `Ôn thẻ môn ${subject.label}` : 'Ôn tập')

  const cap = useMemo(() => docCapTuQuery(searchParams), [searchParams])

  if (!subject) return <Navigate to="/goc-hoc-tap" replace />

  // Đổi người học/môn/cap là phiên mới: bỏ ngay thẻ và tiến độ của phiên cũ,
  // kể cả trước khi effect nạp nội dung mới chạy.
  return (
    <StemReviewSession
      key={`${user?.id ?? ''}:${subject.id}:${cap ?? ''}`}
      uid={user?.id}
      subject={subject}
      cap={cap}
    />
  )
}

function StemReviewSession({
  uid,
  subject,
  cap,
}: {
  uid: string | undefined
  subject: StemSubject
  cap: number | undefined
}) {
  const nav = useNavigate()

  // Chốt hàng đợi MỘT LẦN lúc vào phiên (như ProgrammingReview): chấm xong một thẻ là nó hết
  // đến hạn, tính lại sau mỗi lần chấm thì danh sách tụt dần dưới chân người học.
  const hangDoiRef = useMemo<StemSrsCardRef[] | null>(
    () => (uid ? getDueStemCardsForSubject(uid, subject.id, cap) : null),
    [uid, subject.id, cap],
  )

  const [hangDoi, setHangDoi] = useState<StemSrsCard[] | 'error' | null>(null)
  const [lanThu, setLanThu] = useState(0)
  useEffect(() => {
    if (!hangDoiRef) return
    let huy = false
    hydrateStemCards(hangDoiRef)
      .then((cards) => {
        if (!huy) setHangDoi(cards)
      })
      .catch(() => {
        if (!huy) setHangDoi('error')
      })
    return () => {
      huy = true
    }
  }, [hangDoiRef, lanThu])

  const daNap = hangDoi !== null && hangDoi !== 'error' ? hangDoi : []
  const cards: FlashcardItem[] = daNap.map((c) => ({
    key: c.key,
    hoi: c.hoi,
    dap: c.dap,
    lessonTitle: c.lessonTitle,
  }))

  // Ghi kết quả đi ĐÚNG hàm cũ (reviewStemCard → reviewWord → pushProgress) — không đường mới.
  const cham = (key: string, rating: Rating) => {
    if (!uid || !daNap.some((card) => card.key === key)) return
    reviewStemCard(uid, key, rating)
  }

  return (
    <>
      <Layout
        onBack={() => nav(`/goc-hoc-tap/${subject.id}`)}
        title={`Ôn thẻ môn ${subject.label}`}
      />
      <PageShell width="standard" baseWidth="max-w-2xl" className="space-y-5">
        <h1
          tabIndex={-1}
          className="sr-only focus:outline-none"
        >{`Ôn thẻ môn ${subject.label}`}</h1>

        {hangDoi === null && (
          <p
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-content-secondary"
            role="status"
          >
            Đang tải thẻ của bạn…
          </p>
        )}

        {hangDoi === 'error' && (
          <div className="rounded-2xl border border-rose-500/40 bg-zinc-900/60 p-4 space-y-3">
            <p className="text-sm text-content" role="alert">
              Không tải được nội dung thẻ (mất mạng?). Thử lại nhé.
            </p>
            <button
              type="button"
              onClick={() => {
                setHangDoi(null)
                setLanThu((n) => n + 1)
              }}
              className={buttonClass()}
            >
              Tải lại thẻ
            </button>
          </div>
        )}

        {hangDoi !== null && hangDoi !== 'error' && cards.length === 0 && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-2">
            <p className="flex items-center gap-2 text-sm font-bold text-content">
              <CheckCircle2
                className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900"
                aria-hidden="true"
              />
              <span>Hôm nay không có thẻ nào tới hạn</span>
            </p>
            <p className="text-sm text-content-secondary leading-relaxed">
              Thẻ môn {subject.label} vào vòng ôn khi bạn HOÀN THÀNH một bài — học thêm một bài nữa
              là có thẻ. Nghỉ ngơi cũng là một phần của việc nhớ lâu.
            </p>
            <button
              type="button"
              onClick={() => nav(duongDanDanhSachBai(subject.id))}
              className={buttonClass()}
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Xem bài học môn {subject.label}</span>
            </button>
          </div>
        )}

        {cards.length > 0 && (
          <FlashcardReview
            cards={cards}
            onRate={cham}
            duoiThe={(the) => {
              const goc = daNap.find((c) => c.key === the.key)
              if (!goc) return null
              return (
                <button
                  type="button"
                  onClick={() => nav(duongDanBaiCuaThe(goc))}
                  className="tap-44 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-content-secondary text-sm transition"
                >
                  <Brain className="w-4 h-4" aria-hidden="true" />
                  <span>Mở lại bài này</span>
                </button>
              )
            }}
          />
        )}
      </PageShell>
    </>
  )
}
