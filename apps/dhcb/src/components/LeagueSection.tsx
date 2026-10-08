// src/components/LeagueSection.tsx — Giải đấu tuần (② M5): bảng xếp hạng + opt-in nickname.
// Dùng trong trang Challenge (nộp challenge = hoạt động ghi điểm cao nhất của giải, ② M5b).
// Điểm/hạng luôn đọc từ /api/leaderboard (server) — component này KHÔNG tự tính gì.
import { thongDiepLoiThanThien } from '../lib/friendlyError'
import { useEffect, useRef, useState } from 'react'
import { Trophy, LogOut } from 'lucide-react'
import {
  fetchLeaderboard,
  setLeagueNickname,
  optOutLeague,
  type LeaderboardResponse,
} from '../lib/leaderboardApi'
import { useToast } from '@core/ToastProvider'
import { buttonClass } from '@core/buttonStyles'

const NICKNAME_MIN = 3
const NICKNAME_MAX = 20

function medalFor(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function LeagueSection({ isA }: { isA: boolean }) {
  const toast = useToast()
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    setLoading(true)
    setError('')
    fetchLeaderboard()
      .then((res) => {
        setData(res)
        setNickname(res.me.nickname ?? '')
      })
      .catch((e: unknown) => {
        setError(
          thongDiepLoiThanThien(e, isA ? 'Lỗi tải dữ liệu' : 'Failed to load', isA ? 'vi' : 'en'),
        )
      })
      .finally(() => setLoading(false))
  }

  // Lần nạp đầu lúc mount: loading/error đã ở giá trị khởi tạo (true / '') nên
  // không cần setState đồng bộ; mọi setState nằm trong callback promise (async).
  // Ref chặn nạp lại khi effect re-chạy vì isA đổi (giữ đúng hành vi cũ: chỉ nạp 1 lần).
  const didInitialLoad = useRef(false)
  useEffect(() => {
    if (didInitialLoad.current) return
    didInitialLoad.current = true
    fetchLeaderboard()
      .then((res) => {
        setData(res)
        setNickname(res.me.nickname ?? '')
      })
      .catch((e: unknown) => {
        setError(
          thongDiepLoiThanThien(e, isA ? 'Lỗi tải dữ liệu' : 'Failed to load', isA ? 'vi' : 'en'),
        )
      })
      .finally(() => setLoading(false))
  }, [isA])

  async function join() {
    const trimmed = nickname.trim()
    if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) {
      toast.error(
        isA
          ? `Biệt danh phải từ ${NICKNAME_MIN}-${NICKNAME_MAX} ký tự`
          : `Nickname must be ${NICKNAME_MIN}-${NICKNAME_MAX} characters`,
      )
      return
    }
    setBusy(true)
    try {
      await setLeagueNickname(trimmed)
      toast.success(isA ? 'Đã tham gia giải đấu tuần!' : 'Joined the weekly league!')
      load()
    } catch (e) {
      toast.error(
        thongDiepLoiThanThien(e, isA ? 'Lỗi không xác định' : 'Unknown error', isA ? 'vi' : 'en'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function leave() {
    setBusy(true)
    try {
      await optOutLeague()
      toast.info(isA ? 'Đã rời giải đấu tuần.' : 'Left the weekly league.')
      load()
    } catch (e) {
      toast.error(
        thongDiepLoiThanThien(e, isA ? 'Lỗi không xác định' : 'Unknown error', isA ? 'vi' : 'en'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-accent-400" />
        {isA ? 'Giải đấu tuần' : 'Weekly League'}
      </p>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <span className="w-6 h-6 border-2 border-zinc-700 border-t-accent-400 rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center space-y-2">
          <p className="text-xs text-red-400 theme-light:text-red-700">{error}</p>
          <button
            onClick={load}
            className="tap-44 text-xs text-accent-400 theme-light:text-accent-800 underline hover:text-accent-300 theme-light:hover:text-accent-900"
          >
            {isA ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <p className="text-[0.6875rem] text-zinc-400">
            {isA
              ? 'Điểm cộng khi học từ mới, ôn SRS, luyện Chat/Viết/Nói và nộp challenge. Chỉ hiện biệt danh bạn chọn — không lộ email/tên thật.'
              : 'Points come from learning words, SRS review, Chat/Writing/Speaking, and submitting challenges. Only your chosen nickname is shown — never your email or real name.'}
          </p>

          {data.me.optedIn ? (
            <div className="flex items-center justify-between bg-accent-500/10 border border-accent-500/25 rounded-xl px-3 py-2">
              <div>
                <p className="text-xs text-zinc-400">{isA ? 'Bạn' : 'You'}</p>
                <p className="text-sm font-semibold text-accent-300 theme-light:text-accent-800">
                  {data.me.nickname}
                  {data.me.rank != null && (
                    <span className="ml-1.5 font-normal text-zinc-300">
                      {medalFor(data.me.rank)} · {data.me.points} {isA ? 'điểm' : 'pts'}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => void leave()}
                disabled={busy}
                className="tap-44 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 border border-zinc-700/60 hover:border-zinc-600 disabled:opacity-40 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isA ? 'Rời giải' : 'Leave'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={NICKNAME_MAX}
                placeholder={isA ? 'Đặt biệt danh (3-20 ký tự)' : 'Choose a nickname (3-20 chars)'}
                aria-label={isA ? 'Biệt danh trên bảng xếp hạng' : 'Leaderboard nickname'}
                className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-base sm:text-sm text-white placeholder:text-zinc-400 outline-none focus:border-accent-500/60 transition"
              />
              <button
                onClick={() => void join()}
                disabled={busy || nickname.trim().length < NICKNAME_MIN}
                className={buttonClass({ fullWidth: true })}
              >
                {isA ? 'Tham gia giải đấu tuần' : 'Join the weekly league'}
              </button>
            </div>
          )}

          {data.top.length > 0 ? (
            <ol className="space-y-1">
              {data.top.map((e) => (
                <li
                  key={`${e.rank}-${e.nickname}`}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                    data.me.optedIn && e.nickname === data.me.nickname
                      ? 'bg-accent-500/15 text-accent-300 theme-light:text-accent-800'
                      : 'text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-center shrink-0">{medalFor(e.rank)}</span>
                    {e.nickname}
                  </span>
                  <span className="font-mono">{e.points}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-2">
              {isA
                ? 'Chưa có ai tham gia tuần này — hãy là người đầu tiên!'
                : 'No one has joined this week yet — be the first!'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
