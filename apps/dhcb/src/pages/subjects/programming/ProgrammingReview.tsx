// ProgrammingReview — ÔN THẺ môn Lập trình (PR-L10), bước ⑧ của khuôn bài học 8 bước.
//
// Vì sao môn này cần ôn: học viên đạt bài Make xong là hiểu ngay lúc đó, nhưng ba tuần sau
// vẫn quên "vì sao có vùng chờ", "input() trả kiểu gì". Thẻ SRS giữ lại đúng những khái niệm
// cốt lõi ấy, giãn dần theo FSRS của hệ SRS chung (lib/srs.ts) — không dựng hệ nhắc riêng.
//
// NHỊP CỦA MÀN ÔN (cố ý): hiện câu hỏi → học viên NGHĨ đã rồi mới bấm "Xem đáp án" → tự đánh
// giá 4 mức. Bắt nghĩ trước khi thấy đáp án chính là thứ tạo ra trí nhớ; hiện sẵn cả hai mặt
// thì học viên chỉ đọc lướt và tưởng mình nhớ.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, CheckCircle2, BookOpen } from 'lucide-react'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import { useAuth } from '../../../context/useAuth'
import {
  getDueProgCards,
  hydrateProgCards,
  reviewProgCard,
  type ProgSrsCard,
  type ProgSrsCardRef,
} from '../../../lib/programmingSrs'
import { SRS_SESSION_CAP, type Rating } from '../../../lib/srs'
import { PROGRAMMING_PREFIX, duongDanBaiHoc } from '../../../lib/programmingRoutes'
import FlashcardReview, { type FlashcardItem } from '../../../components/FlashcardReview'
import { buttonClass } from '@core/buttonStyles'

export default function ProgrammingReview() {
  usePageTitle('Ôn tập | Môn Lập trình · Đồng Hành Cùng Bạn')
  const nav = useNavigate()
  const { user } = useAuth()

  // Chốt hàng đợi MỘT LẦN lúc vào phiên (useMemo theo user, KHÔNG theo state của phiên ôn):
  // chấm xong một thẻ là nó hết đến hạn, nếu tính lại sau mỗi lần chấm thì danh sách tụt dần
  // dưới chân người học và số đếm nhảy loạn. getDueProgCards đọc localStorage đồng bộ nên
  // không cần effect — dùng effect + setState ở đây còn gây render dây chuyền (lint chặn).
  const hangDoiRef = useMemo<ProgSrsCardRef[] | null>(
    () => (user ? getDueProgCards(user.id, SRS_SESSION_CAP) : null),
    [user],
  )

  // Nội dung thẻ (câu hỏi/đáp án) nằm trong bài học, nạp lười đúng các unit có thẻ đến hạn —
  // không kéo cả môn vào màn ôn. Ba trạng thái: chưa nạp (null) · lỗi mạng ('error') · xong.
  const [hangDoi, setHangDoi] = useState<ProgSrsCard[] | 'error' | null>(null)
  const [lanThu, setLanThu] = useState(0)
  useEffect(() => {
    if (!hangDoiRef) return
    let huy = false
    hydrateProgCards(hangDoiRef)
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

  const cards: FlashcardItem[] =
    hangDoi !== null && hangDoi !== 'error'
      ? hangDoi.map((c) => ({ key: c.key, hoi: c.hoi, dap: c.dap, lessonTitle: c.lessonTitle }))
      : []

  // Chấm đi đúng hàm ghi CŨ của môn (reviewProgCard → reviewWord → pushProgress) — S12 không
  // mở đường ghi mới nào vào kho SRS.
  const cham = (key: string, rating: Rating) => {
    if (!user) return
    reviewProgCard(user.id, key, rating)
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout onBack={() => nav(PROGRAMMING_PREFIX)} title="Ôn thẻ Lập trình" />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-2xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-2xl" className="space-y-5">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Ôn thẻ Lập trình
        </h1>

        {hangDoi === null && (
          <p
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300"
            role="status"
          >
            Đang tải thẻ của bạn…
          </p>
        )}

        {hangDoi === 'error' && (
          <div className="rounded-2xl border border-rose-500/40 bg-zinc-900/60 p-4 space-y-3">
            <p className="text-sm text-zinc-200" role="alert">
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

        {hangDoi !== null && hangDoi !== 'error' && hangDoi.length === 0 && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-2">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900" />
              <span>Hôm nay không có thẻ nào tới hạn</span>
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Nghỉ ngơi là một phần của việc nhớ lâu — ôn dồn không giúp bạn nhớ hơn. Học thêm một
              bài mới đi, thẻ của bài đó sẽ tự vào vòng ôn khi bạn đạt phần tự viết.
            </p>
            <button onClick={() => nav(PROGRAMMING_PREFIX)} className={buttonClass()}>
              <BookOpen className="w-4 h-4" />
              <span>Về trang môn học</span>
            </button>
          </div>
        )}

        {cards.length > 0 && (
          <FlashcardReview
            cards={cards}
            onRate={cham}
            duoiThe={(the) => (
              <button
                type="button"
                onClick={() => {
                  const goc = hangDoi !== null && hangDoi !== 'error' ? hangDoi : []
                  const cu = goc.find((c) => c.key === the.key)
                  if (cu) nav(duongDanBaiHoc({ id: cu.lessonId, title: cu.lessonTitle }))
                }}
                className="tap-44 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-content-secondary text-sm transition"
              >
                <Brain className="w-4 h-4" aria-hidden="true" />
                <span>Mở lại bài này</span>
              </button>
            )}
          />
        )}
      </PageShell>
    </div>
  )
}
