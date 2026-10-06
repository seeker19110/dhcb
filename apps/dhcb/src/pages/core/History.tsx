import { useState } from 'react'
import { duongDanMonTiengAnh } from '../../lib/subjectsHost'
import { duongDanLuyenNoi, duongDanLuyenViet, duongDanTroTruyen } from '../../lib/englishRoutes'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  PenLine,
  Mic,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { usePageTitle } from '../../lib/usePageTitle'
import {
  getChatSessions,
  getWritingSubs,
  getSpeakingSessions,
  getDirection,
} from '../../lib/storage'
import { useAuth } from '../../context/useAuth'
import { useIsDesktopViewport } from '../../lib/useIsDesktopViewport'
import { useCloudSync } from '../../lib/useCloudSync'
import { parseJson } from '../../lib/ai'
import { situationLabel } from '../../prompts'
import { LEVELS } from '../../types'
import type { ChatSession, WritingSubmission, SpeakingSession } from '../../types'
import { PageShell } from '@core/PageShell'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function levelLabel(level: string) {
  return LEVELS.find((l) => l.value === level)?.labelA ?? level
}

// ── Tab button ───────────────────────────────────────────────────────────────

function Tab({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`tap-44-y flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border ${
        active
          ? 'bg-zinc-800 border-zinc-700 text-white'
          : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-400'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

// ── Chat card ────────────────────────────────────────────────────────────────

function ChatCard({ s }: { s: ChatSession }) {
  const [open, setOpen] = useState(false)
  const dir = getDirection()
  const label = situationLabel(s.situation, dir)
  const userMsgs = s.messages.filter((m) => m.role === 'user').length

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-zinc-800/40 transition"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{label}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {levelLabel(s.level)} · {userMsgs} lượt nói · {formatDate(s.createdAt)}
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-800/60 px-4 py-3 space-y-2 max-h-72 overflow-y-auto">
          {s.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-accent-600/20 border border-accent-500/20 text-accent-100'
                    : 'bg-zinc-800/80 text-zinc-200'
                }`}
              >
                {/* Nếu là assistant có speechEn thì hiển thị phần hội thoại */}
                {m.role === 'assistant' && m.speechEn ? m.speechEn : m.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Writing card ─────────────────────────────────────────────────────────────

interface FeedbackData {
  scores: {
    task_response: number
    coherence: number
    lexical: number
    grammar: number
    overall: number
  }
}

function WritingCard({ s }: { s: WritingSubmission }) {
  const [open, setOpen] = useState(false)
  const fb = s.feedback ? parseJson<FeedbackData>(s.feedback) : null
  const overall = fb?.scores?.overall

  const scoreColor =
    overall == null
      ? ''
      : overall >= 7
        ? 'text-accent-400'
        : overall >= 5
          ? 'text-amber-400 theme-light:text-amber-900'
          : 'text-red-400 theme-light:text-red-900'

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-zinc-800/40 transition"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm line-clamp-1">
            {s.essayPrompt || 'Bài viết tự do'}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{formatDate(s.submittedAt)}</p>
        </div>
        {overall != null && (
          <span className={`text-lg font-black shrink-0 ${scoreColor}`}>{overall}</span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-800/60 px-4 py-3 space-y-3">
          {/* Bài viết của học viên */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-1.5">Bài viết</p>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{s.essay}</p>
          </div>

          {/* Điểm thành phần */}
          {fb?.scores && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-2">Điểm IELTS</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Task', val: fb.scores.task_response },
                  { label: 'Coherence', val: fb.scores.coherence },
                  { label: 'Lexical', val: fb.scores.lexical },
                  { label: 'Grammar', val: fb.scores.grammar },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="bg-zinc-800/60 rounded-xl px-3 py-2 flex justify-between items-center"
                  >
                    <span className="text-xs text-zinc-400">{label}</span>
                    <span
                      className={`text-sm font-bold ${val >= 7 ? 'text-accent-400' : val >= 5 ? 'text-amber-400 theme-light:text-amber-900' : 'text-red-400 theme-light:text-red-900'}`}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Speaking card ─────────────────────────────────────────────────────────────

function SpeakingCard({ s }: { s: SpeakingSession }) {
  const [open, setOpen] = useState(false)
  const dir = getDirection()
  const label = situationLabel(s.situation, dir)
  const userMsgs = s.messages.filter((m) => m.role === 'user').length

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-zinc-800/40 transition"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shrink-0">
          <Mic className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{label}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {levelLabel(s.level)} · {userMsgs} lượt nói · {formatDate(s.createdAt)}
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-800/60 px-4 py-3 space-y-2 max-h-72 overflow-y-auto">
          {s.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
              >
                <div
                  className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-sky-600/20 border border-sky-500/20 text-sky-100 theme-light:text-sky-900'
                      : 'bg-zinc-800/80 text-zinc-200'
                  }`}
                >
                  {m.role === 'assistant' && m.speechEn ? m.speechEn : m.content}
                </div>
                {/* Hiển thị feedback sửa lỗi nếu có */}
                {m.feedbackVi && (
                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 theme-light:text-amber-900 max-w-full">
                    ✅ {m.feedbackVi}
                    {m.correctedEn && <p className="text-accent-400 mt-1">→ {m.correctedEn}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Số mục hiển thị mỗi lần "Xem thêm" — desktop cao và rộng nên nạp nhiều hơn mobile.
const STEP_DESKTOP = 20
const STEP_MOBILE = 8

// ── Main page ─────────────────────────────────────────────────────────────────

type ActiveTab = 'chat' | 'writing' | 'speaking'

// Route + nhãn CTA "Bắt đầu luyện tập" theo đúng tab đang rỗng.
const EMPTY_CTA: Record<ActiveTab, { path: string; label: string }> = {
  chat: { path: duongDanTroTruyen(), label: 'Chat với gia sư' },
  writing: { path: duongDanLuyenViet(), label: 'Luyện viết & chấm điểm' },
  speaking: { path: duongDanLuyenNoi(), label: 'Luyện nói song ngữ' },
}

export default function History() {
  const nav = useNavigate()
  const { user } = useAuth()
  useCloudSync(user?.id)

  usePageTitle('Lịch sử học tập | Đồng Hành Cùng Bạn')

  const [tab, setTab] = useState<ActiveTab>('chat')
  const step = useIsDesktopViewport() ? STEP_DESKTOP : STEP_MOBILE
  // Số mục đang hiển thị của tab hiện tại (phân trang kiểu "Xem thêm").
  const [visible, setVisible] = useState(step)

  if (!user) return null

  const chats = getChatSessions(user.id)
  const writings = getWritingSubs(user.id)
  const speakings = getSpeakingSessions(user.id)

  // Danh sách của tab đang mở + phần đã cắt theo `visible`.
  const currentList: Array<ChatSession | WritingSubmission | SpeakingSession> =
    tab === 'chat' ? chats : tab === 'writing' ? writings : speakings
  const shown = Math.min(visible, currentList.length)
  const remaining = currentList.length - shown

  function switchTab(next: ActiveTab) {
    setTab(next)
    setVisible(step) // đổi tab thì bắt đầu lại từ trang đầu
  }

  const isEmpty =
    (tab === 'chat' && chats.length === 0) ||
    (tab === 'writing' && writings.length === 0) ||
    (tab === 'speaking' && speakings.length === 0)

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout title="Lịch sử học" />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trang danh sách → width="standard". */}
      <PageShell width="standard" baseWidth="max-w-3xl">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Lịch sử học
        </h1>
        {/* Tiêu đề trang — ngay dưới AppHeader, cỡ chữ lớn */}
        {/* [Slice 03] Lịch sử ở đây là của MÔN TIẾNG ANH (Chat / Viết / Nói) — nói rõ ngữ cảnh. */}
        <p className="text-sm text-zinc-300 mb-3">
          Môn tiếng Anh —{' '}
          <Link
            to={duongDanMonTiengAnh()}
            className="underline underline-offset-2 text-accent-300 theme-light:text-accent-800 hover:text-white"
          >
            về trang môn
          </Link>
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <Tab
            active={tab === 'chat'}
            onClick={() => switchTab('chat')}
            icon={MessageCircle}
            label="Chat"
            count={chats.length}
          />
          <Tab
            active={tab === 'writing'}
            onClick={() => switchTab('writing')}
            icon={PenLine}
            label="Viết"
            count={writings.length}
          />
          <Tab
            active={tab === 'speaking'}
            onClick={() => switchTab('speaking')}
            icon={Mic}
            label="Nói"
            count={speakings.length}
          />
        </div>

        {/* Danh sách */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <Clock className="w-12 h-12 text-content-muted mb-3" />
            <p className="text-zinc-400 text-sm">Chưa có lịch sử nào.</p>
            <p className="text-zinc-400 text-xs mt-1 mb-4">Bắt đầu luyện tập để xem lại ở đây!</p>
            <button
              onClick={() => nav(EMPTY_CTA[tab].path)}
              className="tap-44-y flex items-center gap-1.5 bg-accent-500/15 hover:bg-accent-500/25 text-accent-300 theme-light:text-accent-800 text-sm font-medium px-4 py-2.5 rounded-xl transition"
            >
              {EMPTY_CTA[tab].label} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {tab === 'chat' && chats.slice(0, shown).map((s) => <ChatCard key={s.id} s={s} />)}
            {tab === 'writing' &&
              writings.slice(0, shown).map((s) => <WritingCard key={s.id} s={s} />)}
            {tab === 'speaking' &&
              speakings.slice(0, shown).map((s) => <SpeakingCard key={s.id} s={s} />)}

            {/* Nút nạp thêm — chỉ hiện khi còn mục chưa hiển thị */}
            {remaining > 0 && (
              <button
                onClick={() => setVisible((v) => v + step)}
                className="tap-44 w-full py-2.5 rounded-xl text-sm font-medium border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800/60 transition"
              >
                Xem thêm ({remaining})
              </button>
            )}
          </div>
        )}
      </PageShell>
    </div>
  )
}
