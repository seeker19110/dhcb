// apps/dhcb/src/components/studyTabs/SRSReview.tsx — tách từ components/StudyTabs.tsx (2.071 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.
// Barrel `components/StudyTabs.tsx` re-export nên nơi dùng không đổi đường import.

import { useRef, useState, useEffect } from 'react'
import WordCard from '../WordCard'
import type { DictEntry } from '../../types'
import { haptics } from '../../lib/haptics'
import { sound } from '../../lib/sound'
import {
  reviewWord,
  getDueWords,
  getSRSStats,
  SRS_SESSION_CAP,
  syncSrsFromIndexedDB,
  type Rating,
} from '../../lib/srs'
import {
  getSrsOfflineAudioStatus,
  preloadSrsAudio,
  type SrsOfflineStatus,
} from '../../lib/srsPreloader'
import { WifiOff, Download } from 'lucide-react'

// ── Tab Ôn SRS ────────────────────────────────────────────────────────────────
// `pool` = TOÀN BỘ từ đã học (mọi cấp + Mở rộng) — mặc định ôn theo pool này để
// không bỏ sót từ cấp khác đến hạn. `levelPool` = riêng từ vựng của cấp đang mở,
// dùng khi người dùng bật lọc "Chỉ cấp này". Mỗi phiên cap SRS_SESSION_CAP thẻ,
// ưu tiên thẻ quá hạn lâu nhất, để tránh cảm giác ngợp khi quay lại sau vài ngày.
export function SRSReview({
  uid,
  isA,
  pool,
  levelPool,
  onUpdate,
  sessionCap,
}: {
  uid: string
  isA: boolean
  pool: DictEntry[]
  levelPool: DictEntry[]
  onUpdate: () => void
  // Giới hạn số thẻ phiên này — mặc định SRS_SESSION_CAP; luồng "quay lại sau
  // khi bỏ bẵng" (② M4, lib/comeback.ts) truyền cap nhỏ hơn (COMEBACK_SRS_CARDS)
  // để không đập nguyên nợ ôn vào mặt.
  sessionCap?: number
}) {
  const cap = sessionCap ?? SRS_SESSION_CAP
  const [onlyThisLevel, setOnlyThisLevel] = useState(false)
  const activePool = onlyThisLevel ? levelPool : pool
  const [due, setDue] = useState<DictEntry[]>(() => getDueWords(uid, activePool, cap))
  const [idx, setIdx] = useState(0)
  const [sessionDone, setDone] = useState(0)

  // Trạng thái Offline & Preload audio SRS
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )
  const [offlineStatus, setOfflineStatus] = useState<SrsOfflineStatus | null>(null)
  const [preloading, setPreloading] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState<{ done: number; total: number } | null>(
    null,
  )
  // Cờ dừng cho nút "Dừng" — dùng ref để callback shouldStop() luôn đọc giá trị mới nhất
  const stopPreloadRef = useRef(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Tự động sao lưu & khôi phục từ IndexedDB nếu localStorage trống
  useEffect(() => {
    if (!uid) return
    void syncSrsFromIndexedDB(uid).then(() => {
      setDue(getDueWords(uid, activePool, cap))
    })
  }, [uid, activePool, cap])

  // Cập nhật trạng thái audio offline của các thẻ SRS due
  useEffect(() => {
    if (uid && activePool.length > 0) {
      void getSrsOfflineAudioStatus(uid, activePool).then(setOfflineStatus)
    }
  }, [uid, activePool, due, sessionDone])

  async function handlePreloadOffline() {
    if (preloading) {
      // Đang tải → nút thành "Dừng"
      stopPreloadRef.current = true
      return
    }
    stopPreloadRef.current = false
    setPreloading(true)
    // Tổng lấy từ chính bộ đếm trạng thái (mục = câu × giọng), KHÔNG phải due.length —
    // due đã bị cắt theo SRS_SESSION_CAP nên trước đây tiến độ chạy vượt quá tổng.
    setPreloadProgress({ done: 0, total: offlineStatus?.totalDue ?? 0 })
    try {
      await preloadSrsAudio(uid, activePool, {
        onProgress: (done, total) => setPreloadProgress({ done, total }),
        shouldStop: () => stopPreloadRef.current,
      })
    } finally {
      setPreloading(false)
      stopPreloadRef.current = false
      setOfflineStatus(await getSrsOfflineAudioStatus(uid, activePool))
    }
  }

  function toggleScope() {
    const next = !onlyThisLevel
    setOnlyThisLevel(next)
    setDue(getDueWords(uid, next ? levelPool : pool, cap))
    setIdx(0)
  }

  const card = due[idx]

  function rate(rating: Rating) {
    if (!card) return
    // Nhớ/Dễ → rung "thành công"; Quên/Khó → rung chạm thường
    if (rating === 'good' || rating === 'easy') {
      haptics.success()
      sound.correct()
    } else {
      haptics.tap()
      sound.wrong()
    }
    reviewWord(uid, card.word, rating)
    setDone((n) => n + 1)
    onUpdate()
    const nextIdx = idx + 1
    if (nextIdx >= due.length) {
      // Kiểm tra xem còn thẻ "again" nào đến hạn không
      const remaining = getDueWords(uid, activePool, cap)
      setDue(remaining)
      setIdx(0)
    } else {
      setIdx(nextIdx)
    }
  }

  const stats = getSRSStats(uid)
  const totalDue = getDueWords(uid, activePool).length

  const scopeToggle = (
    <button
      onClick={toggleScope}
      className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition"
    >
      {onlyThisLevel
        ? isA
          ? 'Đang lọc: chỉ cấp này — bấm để ôn tất cả'
          : 'Filter: this level only — tap for all levels'
        : isA
          ? 'Đang ôn: tất cả các cấp — bấm để chỉ lọc cấp này'
          : 'Reviewing: all levels — tap to filter this level'}
    </button>
  )

  if (!card) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in space-y-3">
        <p className="text-3xl">{sessionDone > 0 ? '✅' : '🔁'}</p>
        <p className="text-white font-semibold">
          {sessionDone > 0
            ? isA
              ? 'Ôn tập xong hôm nay!'
              : 'All caught up!'
            : isA
              ? 'Không có từ nào cần ôn hôm nay'
              : 'No words due today'}
        </p>
        {sessionDone > 0 && (
          <p className="text-sm text-zinc-400">
            {isA ? `Đã ôn ${sessionDone} thẻ` : `Reviewed ${sessionDone} cards`}
          </p>
        )}
        <div className="text-xs text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
          <p>{isA ? `Tổng trong SRS: ${stats.total} từ` : `Total in SRS: ${stats.total} words`}</p>
          {stats.total === 0 && (
            <p className="text-zinc-400">
              {isA
                ? 'Học từ ở tab Hôm nay → từ tự vào SRS'
                : 'Learn words in Today tab → auto-added to SRS'}
            </p>
          )}
        </div>
        {levelPool.length > 0 && levelPool.length !== pool.length && (
          <div className="pt-1">{scopeToggle}</div>
        )}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Banner thông báo Chế độ Offline */}
      {isOffline && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 mb-3 flex items-center gap-2.5 text-xs text-amber-300 theme-light:text-amber-900">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-400 theme-light:text-amber-900" />
          <div>
            <p className="font-semibold">{isA ? 'Chế độ Học Offline' : 'Offline Learning Mode'}</p>
            <p className="text-amber-200 theme-light:text-amber-900/80">
              {isA
                ? 'Bạn đang ôn tập ngoại tuyến. Lịch SRS & Âm thanh đã sẵn sàng offline, tiến độ tự đồng bộ khi có mạng.'
                : 'Reviewing offline. SRS schedule & audio ready offline, progress auto-syncs when online.'}
            </p>
          </div>
        </div>
      )}

      {/* Thanh tải trước Offline Audio khi Online */}
      {!isOffline && offlineStatus && offlineStatus.totalDue > 0 && (
        <div className="glass rounded-xl px-3.5 py-2.5 mb-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-400 theme-light:text-sky-900 shrink-0" />
              <div>
                <span className="text-zinc-200 font-medium">
                  {isA ? 'Tải trước SRS Offline:' : 'Offline SRS Pre-download:'}
                </span>{' '}
                <span className="text-zinc-400">
                  {offlineStatus.cachedCount}/{offlineStatus.totalDue}{' '}
                  {isA ? 'tệp âm thanh' : 'audio files'}
                </span>
              </div>
            </div>
            <button
              onClick={handlePreloadOffline}
              className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 theme-light:text-sky-900 font-medium transition text-xs shrink-0"
            >
              {preloading
                ? isA
                  ? `Dừng (${preloadProgress?.done ?? 0}/${preloadProgress?.total ?? 0})`
                  : `Stop (${preloadProgress?.done ?? 0}/${preloadProgress?.total ?? 0})`
                : offlineStatus.isFullyPrepared
                  ? isA
                    ? 'Tải lại'
                    : 'Re-check'
                  : isA
                    ? 'Tải ngay'
                    : 'Pre-download'}
            </button>
          </div>

          {/* Thanh tiến độ + giải thích phạm vi: bao nhiêu từ × bao nhiêu giọng của gói */}
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{
                width: `${Math.round(((preloading ? (preloadProgress?.done ?? 0) : offlineStatus.cachedCount) / Math.max(offlineStatus.totalDue, 1)) * 100)}%`,
              }}
            />
          </div>
          <p className="text-zinc-400">
            {isA
              ? `${offlineStatus.wordCount} ${offlineStatus.isLookahead ? 'từ chuẩn bị trước' : 'từ cần ôn + từ mới hôm nay'} × ${offlineStatus.voiceCount} giọng gói bạn đang dùng (kể cả từ và câu ví dụ) — tải xong là nghe được offline dù bật giọng ngẫu nhiên.`
              : `${offlineStatus.wordCount} ${offlineStatus.isLookahead ? 'words prepared ahead' : "words due + today's new words"} × ${offlineStatus.voiceCount} voices in your plan (words and example sentences) — works offline even with random-voice mode on.`}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
        <span>{isA ? 'Ôn lại' : 'SRS Review'}</span>
        <span>
          {idx + 1}/{due.length} {isA ? 'cần ôn' : 'due'}
          {totalDue > due.length ? ` (${totalDue} ${isA ? 'tổng' : 'total'})` : ''}
        </span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full mb-4">
        <div
          className="h-full bg-sky-500 rounded-full transition-all"
          style={{ width: `${(idx / Math.max(due.length, 1)) * 100}%` }}
        />
      </div>

      {/* key theo từ → thẻ mới trượt vào khi chuyển */}
      <div key={card.word} className="animate-fade-in">
        <WordCard card={card} isA={isA} uid={uid} onUpdate={onUpdate} />
      </div>

      {/* Rating buttons */}
      <div className="grid grid-cols-4 gap-2 mt-2">
        {[
          {
            r: 'again' as Rating,
            la: 'Quên',
            lb: 'Again',
            cls: 'bg-rose-500/20 text-rose-300 theme-light:text-rose-900 hover:bg-rose-500/30',
          },
          {
            r: 'hard' as Rating,
            la: 'Khó',
            lb: 'Hard',
            cls: 'bg-orange-500/20 text-orange-300 theme-light:text-orange-900 hover:bg-orange-500/30',
          },
          {
            r: 'good' as Rating,
            la: 'Nhớ',
            lb: 'Good',
            cls: 'bg-sky-500/20 text-sky-300 theme-light:text-sky-900 hover:bg-sky-500/30',
          },
          {
            r: 'easy' as Rating,
            la: 'Dễ',
            lb: 'Easy',
            cls: 'bg-accent-500/20 text-accent-300 hover:bg-accent-500/30',
          },
        ].map(({ r, la, lb, cls }) => (
          <button
            key={r}
            onClick={() => rate(r)}
            className={`py-2.5 rounded-xl text-sm font-medium transition ${cls}`}
          >
            {isA ? la : lb}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-400 mt-2">
        {isA
          ? 'Quên → ôn sớm   ·   Dễ → ôn sau lâu hơn'
          : 'Again = review soon  ·  Easy = review later'}
      </p>
      {levelPool.length > 0 && levelPool.length !== pool.length && (
        <p className="text-center mt-2">{scopeToggle}</p>
      )}
    </div>
  )
}
