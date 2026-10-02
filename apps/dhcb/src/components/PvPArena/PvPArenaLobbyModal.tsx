// apps/dhcb/src/components/PvPArena/PvPArenaLobbyModal.tsx — Sảnh Chờ & Bảng Xếp Hạng Đấu Trường PvP.
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { useDialogBehavior } from '../useDialogBehavior'
import { X, Trophy, Flame, Swords, ChevronRight } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import type {
  PvPPlayerProfile,
  PvPLeaderboardEntry,
  PvPGameMode,
  PvPMatchState,
} from '@dhcb/core-contracts/pvpArena'
import { fetchPvPProfile, matchmakePvPMatch } from '../../lib/pvpArenaApi.js'
import PvPBattlefieldModal from './PvPBattlefieldModal.js'

interface PvPArenaLobbyModalProps {
  onClose: () => void
}

// Hiệu ứng tìm đối thủ tối thiểu 1.2s cho kịch tính — chạy SONG SONG với request
// thật (không cộng dồn sau khi request đã xong) để độ chờ thật = max(request, 1.2s).
const MIN_MATCHING_UI_MS = 1200

export default function PvPArenaLobbyModal({ onClose }: PvPArenaLobbyModalProps) {
  const [profile, setProfile] = useState<PvPPlayerProfile | null>(null)
  const [leaderboard, setLeaderboard] = useState<PvPLeaderboardEntry[]>([])
  const [selectedMode, setSelectedMode] = useState<PvPGameMode>('vocab_speed_duel')
  const [isMatching, setIsMatching] = useState(false)
  const [activeMatch, setActiveMatch] = useState<PvPMatchState | null>(null)
  const [tab, setTab] = useState<'modes' | 'leaderboard'>('modes')
  const toast = useToast()
  // 6 hành vi a11y bắt buộc. Khi sân đấu (PvPBattlefieldModal) mở đè lên, sảnh nhả
  // bẫy tiêu điểm + khoá cuộn để hộp thoại con nắm quyền — tránh hai bẫy chồng nhau.
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose, !activeMatch)

  useEffect(() => {
    fetchPvPProfile()
      .then((data) => {
        setProfile(data.profile)
        setLeaderboard(data.leaderboard)
      })
      .catch(() => toast.error('Không tải được hồ sơ Đấu Trường. Thử mở lại sảnh nhé.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleStartMatch(mode: PvPGameMode) {
    if (isMatching) return
    setIsMatching(true)
    setSelectedMode(mode)

    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_MATCHING_UI_MS))
    try {
      const [match] = await Promise.all([matchmakePvPMatch(mode, profile || undefined), minDelay])
      setIsMatching(false)
      setActiveMatch(match)
    } catch (err) {
      setIsMatching(false)
      toast.error(thongDiepLoiThanThien(err, 'Không ghép được trận đấu. Thử lại nhé.'))
    }
  }

  const modes: Array<{
    id: PvPGameMode
    title: string
    subtitle: string
    icon: string
    time: string
    accentColor: string
  }> = [
    {
      id: 'vocab_speed_duel',
      title: 'Đấu Tốc Độ Từ Vựng (5s)',
      subtitle: 'Phản xạ chọn từ đồng nghĩa, trái nghĩa, collocation nhanh nhất để nhân x1.5 điểm.',
      icon: '⚡',
      time: '5s / lượt',
      accentColor:
        'from-amber-500/20 to-orange-500/30 border-amber-500/40 text-amber-400 theme-light:text-amber-900',
    },
    {
      id: 'grammar_clash',
      title: 'Đấu Bắt Lỗi Ngữ Pháp',
      subtitle: 'Phát hiện lỗi sai thì, hòa hợp chủ vị, đảo ngữ và câu điều kiện trong 8 giây.',
      icon: '📐',
      time: '8s / lượt',
      accentColor:
        'from-indigo-500/20 to-purple-500/30 border-indigo-500/40 text-indigo-400 theme-light:text-indigo-800',
    },
    {
      id: 'toulmin_showdown',
      title: 'Tranh Biện Toulmin Phản Xạ',
      subtitle: 'Nhận diện ngụy biện logic (Fallacy) và chọn luận điểm phản bác đắt giá nhất.',
      icon: '🏛️',
      time: '10s / lượt',
      accentColor:
        'from-emerald-500/20 to-teal-500/30 border-emerald-500/40 text-emerald-400 theme-light:text-emerald-900',
    },
  ]

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto"
        {...backdropProps}
      >
        <div
          {...dialogProps}
          className="relative w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl p-4 sm:p-6 max-h-[90dvh] overflow-y-auto focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 theme-light:text-amber-900 flex items-center justify-center text-xl border border-amber-500/40 shadow-inner">
                ⚔️
              </div>
              <div>
                <h3 id={titleId} className="text-base sm:text-lg font-black text-white">
                  Đấu Trường 1v1 PvP Arena
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Đối kháng thời gian thực & Xếp hạng Elo Rating chuẩn quốc tế
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng sảnh đấu"
              className="tap-44 shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Banner */}
          {profile && (
            <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-indigo-950/30 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-2xl flex items-center justify-center border border-amber-400/40 shadow">
                  {profile.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{profile.name}</span>
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 theme-light:text-amber-900 border border-amber-500/40">
                      Rank {profile.rankTier}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 mt-0.5 flex items-center gap-3">
                    <span className="font-bold text-amber-400 theme-light:text-amber-900">
                      {profile.eloRating} Elo
                    </span>
                    <span>·</span>
                    <span>
                      Thắng {profile.wins}/{profile.totalMatches} trận
                    </span>
                    {profile.winStreak > 0 && (
                      <span className="text-orange-400 theme-light:text-orange-900 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3" /> {profile.winStreak} chuỗi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 mb-4">
            <button
              type="button"
              onClick={() => setTab('modes')}
              className={`tap-44 flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                tab === 'modes'
                  ? 'bg-amber-500/20 text-amber-300 theme-light:text-amber-900 border border-amber-500/40 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Chế độ Thi Đấu</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('leaderboard')}
              className={`tap-44 flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                tab === 'leaderboard'
                  ? 'bg-amber-500/20 text-amber-300 theme-light:text-amber-900 border border-amber-500/40 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Bảng Xếp Hạng Tuần</span>
            </button>
          </div>

          {/* Mode Selector */}
          {tab === 'modes' && (
            <div className="space-y-3">
              {modes.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br border flex items-center justify-center text-xl shrink-0 ${m.accentColor}`}
                    >
                      {m.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{m.title}</h4>
                        <span className="text-[11px] font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                          {m.time}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{m.subtitle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isMatching}
                    onClick={() => handleStartMatch(m.id)}
                    className="tap-44 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isMatching && selectedMode === m.id ? (
                      <span className="animate-pulse">Đang ghép trận...</span>
                    ) : (
                      <>
                        <span>Vào Trận</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard */}
          {tab === 'leaderboard' && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {leaderboard.map((entry) => (
                <div
                  key={entry.playerId}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    entry.rank === 1
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 theme-light:text-amber-900'
                      : entry.rank === 2
                        ? 'bg-zinc-800/60 border-zinc-600 text-zinc-200'
                        : entry.rank === 3
                          ? 'bg-orange-950/20 border-orange-700 text-orange-200 theme-light:text-orange-900'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-sm">
                      {entry.rank === 1
                        ? '🥇'
                        : entry.rank === 2
                          ? '🥈'
                          : entry.rank === 3
                            ? '🥉'
                            : `#${entry.rank}`}
                    </span>
                    <span className="text-xl">{entry.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{entry.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {entry.winRate}% thắng · {entry.winStreak} chuỗi
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-amber-400 theme-light:text-amber-900">
                      {entry.eloRating} Elo
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase">
                      {entry.rankTier}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sân đấu đối kháng khi ghép trận xong */}
      {activeMatch && (
        <PvPBattlefieldModal
          initialMatch={activeMatch}
          onClose={() => setActiveMatch(null)}
          onMatchComplete={() => {
            fetchPvPProfile()
              .then((data) => {
                setProfile(data.profile)
                setLeaderboard(data.leaderboard)
              })
              .catch(() => {
                /* trận đã lưu ở server; hồ sơ chỉ chưa refresh — không chặn người dùng đóng modal */
              })
          }}
        />
      )}
    </>,
    document.body,
  )
}
