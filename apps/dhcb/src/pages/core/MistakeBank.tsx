import { buttonClass } from '@core/buttonStyles'
import { useState, useCallback, useEffect } from 'react'
import { duongDanMonTiengAnh } from '../../lib/subjectsHost'
import { duongDanLuyenViet, duongDanTroTruyen } from '../../lib/englishRoutes'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  Eye,
  Check,
  Trash2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookMarked,
  ShieldCheck,
  PenLine,
} from 'lucide-react'
import Layout from '../../components/Layout'
import KaraokeText from '../../components/KaraokeText'
import { usePageTitle } from '../../lib/usePageTitle'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../context/useLang'
import { useIsDesktopViewport } from '../../lib/useIsDesktopViewport'
import { PageShell } from '@core/PageShell'
import {
  getMistakes,
  getDueMistakes,
  markReviewed,
  deleteMistakeSynced,
  syncMistakes,
  type Mistake,
  type MistakeSource,
} from '../../lib/mistakes'
import { duongDanOnLaiLoiAnh, duongDanCauSaiStem } from '../../lib/mistakeRoutes'
import { stateTuThuLai } from '../../lib/stemRetry'
import {
  mistakesFromEvidence,
  getDueEvidenceMistakes,
  type MistakeEntry,
} from '../../lib/evidenceMistakes'
import { fetchEvidenceAttempts } from '../../lib/stemEvidence'
import { nhanLyDo } from '../../lib/gradeReasonLabel'
import { STEM_SUBJECTS } from '../../lib/stemLessonRoutes'
import type { StemSubjectId } from '@dhcb/core-contracts/stemLesson'

// ── Bộ lọc môn (S12-2, AC-11) ────────────────────────────────────────────────
//
// Sổ lỗi từng chỉ có môn Anh. Nay mỗi môn có một NGUỒN BẰNG CHỨNG khác nhau, và chúng KHÔNG
// gộp chung được thành một danh sách: lỗi môn Anh là thẻ ghi tay do AI sửa trong hội thoại, còn
// lỗi STEM là câu sai trong một lượt làm bài có thể quay về đúng câu. Gộp chung thì nút "Ôn lại"
// chỉ dẫn đúng được một nửa — nên lọc theo môn trước, rồi mới hiện danh sách của môn đó.
type MonLoi = 'english' | StemSubjectId | 'programming'

const MON_LOI: readonly { id: MonLoi; nhan: string }[] = [
  { id: 'english', nhan: 'Tiếng Anh' },
  ...Object.values(STEM_SUBJECTS).map((m) => ({ id: m.id as MonLoi, nhan: m.label })),
  { id: 'programming', nhan: 'Lập trình' },
]

/** Ngày đọc được cho nhãn bằng chứng — không giờ phút, sổ lỗi không cần độ chính xác đó. */
function ngayNgan(ms: number): string {
  return new Date(ms).toLocaleDateString('vi-VN')
}

// Nhãn + emoji cho từng nguồn lỗi (Chat / Viết / Nói).
const SOURCE_META: Record<MistakeSource, { emoji: string; vi: string; en: string }> = {
  chat: { emoji: '💬', vi: 'Trò chuyện', en: 'Chat' },
  writing: { emoji: '✍️', vi: 'Luyện viết', en: 'Writing' },
  speaking: { emoji: '🎤', vi: 'Luyện nói', en: 'Speaking' },
}

/**
 * Nhãn "có bằng chứng" / "ghi tay" — KHÔNG BAO GIỜ giả bằng chứng cho thẻ không có `attemptId`.
 * Đây là điều kiện để con số/lời hứa của sản phẩm còn đáng tin (CLAUDE.md §5).
 */
function EvidenceBadge({ mistake }: { mistake: Mistake }) {
  if (mistake.attemptId) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 theme-light:text-emerald-900 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2 py-0.5">
        <ShieldCheck className="w-3 h-3" aria-hidden="true" />
        có bằng chứng · {ngayNgan(mistake.createdAt)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800/70 border border-zinc-700/50 rounded-full px-2 py-0.5">
      <PenLine className="w-3 h-3" aria-hidden="true" />
      ghi tay
    </span>
  )
}

function SourceBadge({ source, vi }: { source: MistakeSource; vi: boolean }) {
  const m = SOURCE_META[source]
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800/70 border border-zinc-700/50 rounded-full px-2 py-0.5">
      <span aria-hidden>{m.emoji}</span>
      {vi ? m.vi : m.en}
    </span>
  )
}

// ── Thẻ ôn 1 lỗi (câu sai → tự sửa → lật xem đáp án) ──────────────────────────
function ReviewCard({
  mistake,
  isA,
  onRemembered,
  onSkip,
  onDelete,
}: {
  mistake: Mistake
  isA: boolean
  onRemembered: () => void
  onSkip: () => void
  onDelete: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  // Chiều A: câu sai/đúng là tiếng Anh, giải thích tiếng Việt · Chiều B: ngược lại.
  const targetLang = isA ? ('en-US' as const) : ('vi-VN' as const)
  const explLang = isA ? ('vi-VN' as const) : ('en-US' as const)

  return (
    <div className="glass rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="flex flex-wrap items-center gap-1.5 min-w-0">
          <SourceBadge source={mistake.source} vi={isA} />
          <EvidenceBadge mistake={mistake} />
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {mistake.count > 1 && (
            <span className="text-[11px] text-amber-400 theme-light:text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
              {isA ? `Lặp ${mistake.count} lần` : `${mistake.count}× repeated`}
            </span>
          )}
          <button
            onClick={onDelete}
            className="tap-44 text-zinc-500 hover:text-red-400 transition p-1"
            aria-label={isA ? 'Xóa lỗi này' : 'Delete this mistake'}
            title={isA ? 'Xóa lỗi này' : 'Delete this mistake'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Câu sai */}
      <p className="text-[11px] text-content-secondary mb-1">
        {isA ? 'Câu bạn đã viết' : 'What you wrote'}
      </p>
      <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5 mb-3">
        <KaraokeText
          text={mistake.wrong}
          lang={targetLang}
          textClass="text-sm leading-relaxed text-red-300 theme-light:text-red-700"
        />
      </div>

      {!revealed ? (
        <>
          <p className="text-xs text-content-secondary text-center mb-3">
            {isA ? 'Bạn thử tự sửa trong đầu, rồi xem đáp án nhé.' : 'Try to fix it, then reveal.'}
          </p>
          <button
            onClick={() => setRevealed(true)}
            className={buttonClass({ fullWidth: true, size: 'lg' })}
          >
            <Eye className="w-4 h-4" />
            {isA ? 'Xem đáp án' : 'Reveal answer'}
          </button>
        </>
      ) : (
        <div className="animate-fade-in space-y-3">
          {mistake.corrected && (
            <div>
              <p className="text-[11px] text-content-secondary mb-1">
                {isA ? 'Câu đúng' : 'Corrected'}
              </p>
              <div className="bg-accent-500/8 border border-accent-500/25 rounded-xl px-3 py-2.5">
                <KaraokeText
                  text={mistake.corrected}
                  lang={targetLang}
                  textClass="text-sm leading-relaxed text-accent-300 theme-light:text-accent-800"
                />
              </div>
            </div>
          )}
          {mistake.explanation && (
            <div>
              <p className="text-[11px] text-content-secondary mb-1">
                {isA ? 'Giải thích' : 'Explanation'}
              </p>
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5">
                <KaraokeText
                  text={mistake.explanation}
                  lang={explLang}
                  textClass="text-xs leading-relaxed text-amber-200 theme-light:text-amber-800"
                  iconSize="xs"
                />
              </div>
            </div>
          )}
          {/* "Ôn lại lỗi này" = quay về ĐÚNG màn đã sinh ra lỗi, để luyện lại chính chỗ đó
              thay vì đọc lại thẻ. Lỗi môn Anh mắc trong hội thoại/bài viết tự do nên không neo
              được tới một câu cụ thể — dẫn tới màn nguồn là xa nhất có thể đi mà vẫn thật. */}
          <Link
            to={duongDanOnLaiLoiAnh(mistake.source)}
            className="tap-44 w-full flex items-center justify-center gap-1.5 rounded-xl border border-accent-500/40 bg-accent-500/10 py-2.5 text-sm font-semibold text-accent-300 theme-light:text-accent-800 transition hover:bg-accent-500/20"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {isA
              ? `Ôn lại lỗi này ở ${SOURCE_META[mistake.source].vi}`
              : `Practise again in ${SOURCE_META[mistake.source].en}`}
          </Link>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onSkip}
              className="tap-44 flex-1 flex items-center justify-center gap-1.5 border border-zinc-700/70 hover:border-zinc-600 text-zinc-300 rounded-xl py-2.5 text-sm transition hover:bg-zinc-800/50 active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              {isA ? 'Vẫn khó' : 'Still hard'}
            </button>
            <button onClick={onRemembered} className={buttonClass({ className: 'flex-1' })}>
              <Check className="w-4 h-4" />
              {isA ? 'Đã nhớ' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Một dòng trong danh sách "Tất cả" (gọn, có nút xóa) ───────────────────────
function ListRow({
  mistake,
  isA,
  onDelete,
}: {
  mistake: Mistake
  isA: boolean
  onDelete: () => void
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="flex flex-wrap items-center gap-1.5 min-w-0">
          <SourceBadge source={mistake.source} vi={isA} />
          <EvidenceBadge mistake={mistake} />
        </span>
        <button
          onClick={onDelete}
          className="tap-44 text-zinc-500 hover:text-red-400 transition p-1"
          aria-label={isA ? 'Xóa' : 'Delete'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-red-300 theme-light:text-red-700 line-through break-words">
        {mistake.wrong}
      </p>
      {mistake.corrected && (
        <p className="text-xs text-accent-300 theme-light:text-accent-800 break-words mt-0.5">
          → {mistake.corrected}
        </p>
      )}
      {mistake.explanation && (
        <p className="text-[11px] text-content-secondary break-words mt-1">{mistake.explanation}</p>
      )}
      {/* [S11b] Nhãn nói ĐÚNG nơi sẽ mở: lỗi môn Anh không neo được tới câu nào, nên không hứa
          "sửa đúng câu này" — cùng khuôn với thẻ ôn ở trên. */}
      <Link
        to={duongDanOnLaiLoiAnh(mistake.source)}
        className="tap-44 mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 theme-light:text-accent-800 hover:underline"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        {isA
          ? `Ôn lại ở ${SOURCE_META[mistake.source].vi}`
          : `Practise again in ${SOURCE_META[mistake.source].en}`}
      </Link>
    </div>
  )
}

// ── Sổ lỗi STEM: đọc từ BẰNG CHỨNG, không có bảng lỗi riêng ───────────────────
//
// Mỗi mục là một CÂU còn sai trong một bài đã làm, nên "Ôn lại lỗi này" đi thẳng tới đúng bài
// và neo tới đúng câu — khác hẳn lỗi môn Anh (chỉ về được tới màn nguồn).
function StemMistakeRow({ entry }: { entry: MistakeEntry }) {
  // Tiêu đề lấy ĐỒNG BỘ từ chỉ mục nhẹ (không nạp nội dung bài): đủ để người học nhận ra bài,
  // và để URL mang tiêu đề theo quy ước `<mã>--<slug>`.
  const tieuDe = STEM_SUBJECTS[entry.subjectId].loader.getSummary(entry.contentId)?.title ?? ''
  // Mã lạ (server mới hơn) → ẩn dòng lý do thay vì in mã máy ra cho người học đọc.
  const lyDo = nhanLyDo(entry.reason)
  return (
    <li className="rounded-xl border border-zinc-800/80 bg-zinc-900/80 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 theme-light:text-emerald-900 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2 py-0.5">
          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
          {entry.evidenceKind === 'local_graded'
            ? `chấm trên thiết bị · ${ngayNgan(entry.lastWrongAt)}`
            : `có bằng chứng · ${ngayNgan(entry.lastWrongAt)}`}
        </span>
        {entry.count > 1 && (
          <span className="text-[11px] text-amber-400 theme-light:text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
            Sai {entry.count} lần
          </span>
        )}
      </div>
      <p className="text-sm text-content break-words">
        {tieuDe || entry.contentId} · câu {entry.questionIndex + 1}
      </p>
      {lyDo && (
        <p className="text-[11px] text-content-secondary break-words mt-0.5">
          Kết quả chấm: {lyDo}
        </p>
      )}
      {/* [S11b] state = "mở để TỰ THỬ LẠI": trang bài ẩn đáp án cũ + lời giải của câu này cho tới
          khi người học trả lời lại (lib/stemRetry.ts). URL `#cau-N` giữ nguyên hợp đồng. */}
      <Link
        to={duongDanCauSaiStem(entry.subjectId, entry.contentId, entry.questionIndex, tieuDe)}
        state={stateTuThuLai(entry.questionIndex)}
        className="tap-44 mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 theme-light:text-accent-800 hover:underline"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        Ôn lại lỗi này
      </Link>
    </li>
  )
}

export default function MistakeBank() {
  const user = useAuth().user! // RequireAuth đảm bảo có user
  const nav = useNavigate()
  // [Slice 04] Chữ giao diện theo ngôn ngữ giao diện, không theo chiều học Tiếng Anh.
  const isA = useLang().lang === 'vi'

  const [tab, setTab] = useState<'review' | 'all'>('review')
  const [mon, setMon] = useState<MonLoi>('english')
  // Nhật ký bằng chứng nạp LƯỜI theo môn: mở trang sổ lỗi mà tải sẵn cả bốn môn STEM là bốn
  // request cho thứ phần lớn người dùng không mở tới.
  // Khoá bộ đệm mang CẢ số lần thử lại: bấm "Thử lại" sinh khoá mới, nên ô chưa có kết quả
  // hiện "đang tải" mà không cần đặt state ngay trong thân effect (lint chặn — đó là một lượt
  // render dây chuyền).
  const [stemTheoMon, setStemTheoMon] = useState<
    Record<string, { status: 'ready' | 'error'; entries: MistakeEntry[] }>
  >({})
  const [lanThu, setLanThu] = useState(0)
  // Tab "Tất cả" có thể rất dài — phân trang kiểu "Xem thêm", desktop nạp nhiều hơn mobile.
  const step = useIsDesktopViewport() ? 20 : 8
  const [visible, setVisible] = useState(step)
  // "Bộ ôn" chốt 1 lần khi vào để thứ tự không nhảy khi ta markReviewed từng thẻ.
  const [deck, setDeck] = useState<Mistake[]>(() => getDueMistakes(user.id))
  const [pos, setPos] = useState(0)
  // Toàn bộ lỗi (tab "Tất cả") giữ ở state, cập nhật lại sau mỗi lần xóa.
  const [all, setAll] = useState<Mistake[]>(() => getMistakes(user.id))

  usePageTitle('Sổ tay lỗi sai | Đồng Hành Cùng Bạn')

  const totalDue = deck.length
  const current = deck[pos]

  // Hợp nhất sổ cục bộ với sổ trên server một lần khi mở trang — nhờ vậy lỗi ghi ở máy khác
  // cũng hiện ra ở đây. Ngoại tuyến thì syncMistakes() trả về sổ cục bộ, không có gì đổi.
  useEffect(() => {
    let cancelled = false
    void syncMistakes(user.id).then((merged) => {
      if (cancelled) return
      setAll(merged)
      // Chỉ nạp lại bộ ôn khi người dùng chưa bắt đầu ôn, để thứ tự thẻ không nhảy giữa chừng.
      setPos((p) => {
        if (p === 0) setDeck(getDueMistakes(user.id))
        return p
      })
    })
    return () => {
      cancelled = true
    }
  }, [user.id])

  // Đẩy kết quả ôn lên server MỘT LẦN khi hết bộ, thay vì mỗi thẻ một request — markReviewed()
  // ghi localStorage tức thì, còn đây là lúc gom cả phiên ôn gửi lên.
  const deckFinished = deck.length > 0 && pos >= deck.length
  useEffect(() => {
    if (deckFinished) void syncMistakes(user.id)
  }, [deckFinished, user.id])

  // Nạp nhật ký bằng chứng của ĐÚNG môn đang xem. Lỗi mạng KHÔNG được hiện thành "không có
  // lỗi nào" — trạng thái 'error' có lối "Thử lại" riêng (đặc tả §③.4).
  const monStem = mon === 'english' || mon === 'programming' ? null : mon
  useEffect(() => {
    if (!monStem) return
    const khoa = `${monStem}:${lanThu}`
    let cancelled = false
    void fetchEvidenceAttempts(user.id, monStem).then(({ status, attempts }) => {
      if (cancelled) return
      const entries = getDueEvidenceMistakes(mistakesFromEvidence(attempts), Date.now())
      setStemTheoMon((prev) => ({
        ...prev,
        [khoa]: { status: status === 'error' ? 'error' : 'ready', entries },
      }))
    })
    return () => {
      cancelled = true
    }
  }, [monStem, user.id, lanThu])

  const stemHienTai = monStem ? stemTheoMon[`${monStem}:${lanThu}`] : undefined

  const advance = useCallback(() => setPos((p) => p + 1), [])

  const handleRemembered = useCallback(() => {
    if (current) markReviewed(user.id, current.id)
    advance()
  }, [current, user.id, advance])

  const handleDeleteInDeck = useCallback(() => {
    if (current) void deleteMistakeSynced(user.id, current.id)
    setAll(getMistakes(user.id))
    advance()
  }, [current, user.id, advance])

  const handleDeleteInList = useCallback(
    (id: string) => {
      void deleteMistakeSynced(user.id, id)
      setDeck((d) => d.filter((m) => m.id !== id))
      setAll((a) => a.filter((m) => m.id !== id))
    },
    [user.id],
  )

  const restartDeck = useCallback(() => {
    setDeck(getDueMistakes(user.id))
    setPos(0)
  }, [user.id])

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout backTo={duongDanMonTiengAnh()} title={isA ? 'Sổ lỗi của tôi' : 'My Mistake Bank'} />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang danh sách → width="standard". */}
      <PageShell width="standard" baseWidth="max-w-2xl" className="space-y-5">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? 'Sổ lỗi của tôi' : 'My Mistake Bank'}
        </h1>

        {/* Bộ lọc môn — mỗi môn một NGUỒN bằng chứng khác nhau nên không gộp một danh sách. */}
        <div
          role="group"
          aria-label="Lọc sổ lỗi theo môn"
          className="flex flex-wrap gap-2"
          data-testid="loc-mon-loi"
        >
          {MON_LOI.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMon(m.id)}
              aria-pressed={mon === m.id}
              className={`tap-44 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                mon === m.id
                  ? 'bg-accent-500/15 border-accent-500/40 text-accent-300 theme-light:text-accent-800'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {m.nhan}
            </button>
          ))}
        </div>

        {mon === 'english' &&
          (all.length === 0 ? (
            // ── Chưa có lỗi nào ──────────────────────────────────────────────
            <div className="glass rounded-2xl p-8 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
                <BookMarked className="w-7 h-7 text-accent-400" />
              </div>
              <p className="text-sm text-content mb-1 font-medium">
                {isA ? 'Chưa có lỗi nào được ghi' : 'No mistakes recorded yet'}
              </p>
              <p className="text-xs text-content-secondary mb-5 max-w-xs mx-auto">
                {isA
                  ? 'Khi bạn luyện Chat, Viết hoặc Nói và AI sửa lỗi, lỗi đó sẽ tự động vào đây để ôn lại.'
                  : 'When you practise Chat, Writing or Speaking and the AI corrects you, the mistake lands here to review.'}
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => nav(duongDanTroTruyen())} className={buttonClass()}>
                  {isA ? 'Luyện Chat →' : 'Practise Chat →'}
                </button>
                <button
                  onClick={() => nav(duongDanLuyenViet())}
                  className="tap-44 text-sm border border-zinc-700/70 text-zinc-300 px-4 py-2.5 rounded-xl transition hover:bg-zinc-800/50"
                >
                  {isA ? 'Luyện Viết' : 'Writing'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs: Cần ôn / Tất cả */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTab('review')}
                  className={`tap-44 flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                    tab === 'review'
                      ? 'bg-accent-500/15 border-accent-500/40 text-accent-300 theme-light:text-accent-800'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {isA ? 'Cần ôn' : 'To review'} ({totalDue})
                </button>
                <button
                  onClick={() => {
                    setTab('all')
                    setVisible(step) // mở lại tab thì bắt đầu từ trang đầu
                  }}
                  className={`tap-44 flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                    tab === 'all'
                      ? 'bg-accent-500/15 border-accent-500/40 text-accent-300 theme-light:text-accent-800'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {isA ? 'Tất cả' : 'All'} ({all.length})
                </button>
              </div>

              {tab === 'review' ? (
                current ? (
                  <>
                    <p className="text-center text-xs text-content-secondary">
                      {pos + 1} / {totalDue}
                    </p>
                    <ReviewCard
                      key={current.id}
                      mistake={current}
                      isA={isA}
                      onRemembered={handleRemembered}
                      onSkip={advance}
                      onDelete={handleDeleteInDeck}
                    />
                  </>
                ) : (
                  // Hết bộ ôn
                  <div className="glass rounded-2xl p-8 text-center animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-7 h-7 text-accent-400" />
                    </div>
                    <p className="text-sm text-content font-medium mb-1">
                      {totalDue > 0
                        ? isA
                          ? 'Xong rồi! Bạn đã ôn hết lỗi hôm nay 🎉'
                          : 'Done! You reviewed all due mistakes 🎉'
                        : isA
                          ? 'Không có lỗi nào cần ôn hôm nay'
                          : 'No mistakes due today'}
                    </p>
                    <p className="text-xs text-content-secondary mb-5">
                      {isA
                        ? 'Lỗi đã ôn sẽ quay lại sau vài ngày để nhớ lâu hơn.'
                        : 'Reviewed mistakes come back in a few days to strengthen memory.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {totalDue > 0 && (
                        <button
                          onClick={restartDeck}
                          className="text-sm border border-zinc-700/70 text-zinc-300 px-4 py-2.5 rounded-xl transition hover:bg-zinc-800/50 flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {isA ? 'Ôn lại' : 'Review again'}
                        </button>
                      )}
                      <button onClick={() => nav('/tien-do')} className={buttonClass()}>
                        {isA ? 'Xem tiến độ' : 'View progress'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                // Tab "Tất cả" — danh sách gọn, có nút xóa
                <div className="space-y-2 animate-fade-in">
                  {all.slice(0, visible).map((m) => (
                    <ListRow
                      key={m.id}
                      mistake={m}
                      isA={isA}
                      onDelete={() => handleDeleteInList(m.id)}
                    />
                  ))}
                  {/* Nút nạp thêm — chỉ hiện khi còn lỗi chưa hiển thị */}
                  {all.length > visible && (
                    <button
                      onClick={() => setVisible((v) => v + step)}
                      className="tap-44 w-full py-2.5 rounded-xl text-sm font-medium border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800/60 transition"
                    >
                      {isA ? 'Xem thêm' : 'Show more'} ({all.length - visible})
                    </button>
                  )}
                </div>
              )}
            </>
          ))}

        {mon === 'programming' && (
          <div className="glass rounded-2xl p-6 space-y-2" role="status">
            <p className="text-sm font-bold text-content">Chưa có bằng chứng câu sai</p>
            <p className="text-sm text-content-secondary leading-relaxed">
              Bài Lập trình chấm bằng bộ kiểm thử chứ không ghi lại từng câu trả lời, nên chưa có dữ
              liệu nào để dựng sổ lỗi. Ta cố ý KHÔNG dựng một sổ ghi tay ở đây: mục không có bằng
              chứng thì con số trên trang không còn đáng tin.
            </p>
            <Link
              to="/goc-hoc-tap/programming/on-tap"
              className="tap-44 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 theme-light:text-accent-800 hover:underline"
            >
              Ôn thẻ môn Lập trình
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {monStem && (
          <div className="space-y-3">
            {!stemHienTai && (
              <p className="text-sm text-content-secondary" role="status">
                Đang tải câu sai từ bài đã làm…
              </p>
            )}
            {stemHienTai?.status === 'error' && (
              <div className="glass rounded-2xl p-5 space-y-2" role="status">
                <p className="text-sm font-bold text-content">Chưa tải được lỗi từ bài STEM</p>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Không phải là bạn không còn lỗi nào — chỉ là chưa đọc được nhật ký bài làm.
                </p>
                <button
                  type="button"
                  onClick={() => setLanThu((n) => n + 1)}
                  className="tap-44 inline-flex items-center gap-1.5 rounded-xl border border-zinc-700/70 px-3 py-2 text-sm font-semibold text-content transition hover:bg-zinc-800/50"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Thử lại
                </button>
              </div>
            )}
            {stemHienTai?.status === 'ready' &&
              (stemHienTai.entries.length === 0 ? (
                <div className="glass rounded-2xl p-6 space-y-2" role="status">
                  <p className="text-sm font-bold text-content">Không còn câu nào sai</p>
                  <p className="text-sm text-content-secondary leading-relaxed">
                    Câu nào đã trả lời đúng ở lượt sau thì tự rời khỏi sổ — sổ lỗi là “còn sai gì”,
                    không phải nhật ký lỗi cũ.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {stemHienTai.entries.map((e) => (
                    <StemMistakeRow key={e.entryId} entry={e} />
                  ))}
                </ul>
              ))}
          </div>
        )}
      </PageShell>
    </div>
  )
}
