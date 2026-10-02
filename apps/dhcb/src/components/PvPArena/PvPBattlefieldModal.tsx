// apps/dhcb/src/components/PvPArena/PvPBattlefieldModal.tsx — Sân Đấu Đối Kháng 1v1 PvP Trực Tiếp 60 FPS.
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { useDialogBehavior } from '../useDialogBehavior'
import { X, Flame, Timer, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import type { PvPMatchState, PvPRoundAction } from '@dhcb/core-contracts/pvpArena'
import { submitPvPRoundAction } from '../../lib/pvpArenaApi.js'
import { formatEloDelta } from '../../lib/pvpEloDelta'

interface PvPBattlefieldModalProps {
  initialMatch: PvPMatchState
  onClose: () => void
  onMatchComplete?: (match: PvPMatchState) => void
}

export default function PvPBattlefieldModal({
  initialMatch,
  onClose,
  onMatchComplete,
}: PvPBattlefieldModalProps) {
  // 6 hành vi a11y bắt buộc của hộp thoại (Escape, bẫy tiêu điểm, khoá cuộn nền…).
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose)
  const [match, setMatch] = useState<PvPMatchState>(initialMatch)
  const [currentRound, setCurrentRound] = useState(0)
  const [timeLeft, setTimeLeft] = useState(initialMatch.questions[0]?.timeLimitSec || 5)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [roundResult, setRoundResult] = useState<{
    p1Action?: PvPRoundAction
    p2Action?: PvPRoundAction
    showExplanation: boolean
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const toast = useToast()

  const currentQ = match.questions[currentRound]

  // Reset state hiển thị khi sang vòng mới — mẫu "so sánh prev trong render"
  // (React cho phép setState có điều kiện ngay trong render, thay cho setState
  // đồng bộ trong effect trước đây). Lần mount (vòng 0) các state đã đúng giá trị khởi tạo.
  const [prevRound, setPrevRound] = useState(currentRound)
  if (prevRound !== currentRound) {
    setPrevRound(currentRound)
    if (currentQ) setTimeLeft(currentQ.timeLimitSec)
    setSelectedOption(null)
    setRoundResult(null)
    setIsSubmitting(false)
  }

  // Reset timer on new round — effect chỉ còn quản lý ref + interval (external system)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isFinished || !currentQ) return

    startTimeRef.current = Date.now()

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          // Hết giờ -> Tự động submit bỏ lỡ
          void handleOptionSelect(-1, currentQ.timeLimitSec * 1000)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentRound, isFinished])
  /* eslint-enable react-hooks/exhaustive-deps */

  async function handleOptionSelect(optionIndex: number, forcedElapsedMs?: number) {
    if (isSubmitting || selectedOption !== null) return
    setIsSubmitting(true)
    setSelectedOption(optionIndex)
    if (timerRef.current) clearInterval(timerRef.current)

    const responseTimeMs =
      forcedElapsedMs !== undefined ? forcedElapsedMs : Date.now() - startTimeRef.current

    try {
      const res = await submitPvPRoundAction({
        matchId: match.matchId,
        roundIndex: currentRound,
        selectedOption: optionIndex,
        responseTimeMs,
      })

      setRoundResult({
        p1Action: res.p1Action,
        p2Action: res.p2Action,
        showExplanation: true,
      })

      setMatch(res.match)

      // Chờ 2.5 giây hiển thị kết quả hiệp rồi chuyển vòng hoặc kết thúc
      setTimeout(() => {
        if (res.isMatchCompleted || currentRound + 1 >= match.totalRounds) {
          setIsFinished(true)
          onMatchComplete?.(res.match)
        } else {
          setCurrentRound((r) => r + 1)
        }
      }, 2500)
    } catch (err) {
      // Không rõ trận còn sống không (network chớp giữa chừng) — cho người chơi thử lại
      // ngay lượt này thay vì treo cứng màn hình.
      toast.error(thongDiepLoiThanThien(err, 'Gửi câu trả lời thất bại. Bấm để thử lại.'))
      setSelectedOption(null)
      setIsSubmitting(false)
    }
  }

  const p1Score = match.scores.player1Score
  const p2Score = match.scores.player2Score
  // Chỉ có sau khi server chốt trận (`finalizePvPMatch`); chưa có thì không hiện số nào.
  const eloDelta = match.eloChanges?.player1Delta ?? null

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto"
      {...backdropProps}
    >
      {/*
        Bỏ `overflow-hidden` (nó CẮT phần cuối trận đấu trên màn hình thấp): thay bằng
        trần chiều cao theo dvh + cho chính khung cuộn được.
      */}
      <div
        {...dialogProps}
        className="relative w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl p-4 sm:p-6 max-h-[90dvh] overflow-y-auto focus:outline-none"
      >
        {/* Header: Thanh điểm và Avatar đối đầu */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 theme-light:text-amber-900 flex items-center justify-center font-bold text-base border border-amber-500/40">
              ⚔️
            </span>
            <div>
              <div
                id={titleId}
                className="text-xs font-bold text-amber-400 theme-light:text-amber-900 uppercase tracking-wider"
              >
                Đấu Trường 1v1 PvP
              </div>
              <div className="text-[11px] text-zinc-400">
                Hiệp {Math.min(currentRound + 1, match.totalRounds)} / {match.totalRounds}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng sân đấu"
            className="tap-44 shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bảng Scoreboard Đối Đầu 2 Bên */}
        <div className="my-4 grid grid-cols-2 gap-3 relative">
          {/* Người chơi (Player 1) */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-2xl flex items-center justify-center border border-indigo-400/40 shrink-0">
              {match.player1.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-indigo-300 theme-light:text-indigo-800 truncate">
                {match.player1.name}
              </div>
              <div className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                <span>{p1Score}</span>
                <span className="text-[11px] font-semibold text-indigo-400 theme-light:text-indigo-800">
                  pts
                </span>
              </div>
            </div>
          </div>

          {/* Biểu tượng VS tâm điểm */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 theme-light:text-amber-900 border border-amber-500/50 flex items-center justify-center text-xs font-black shadow-lg backdrop-blur-md z-10">
            VS
          </div>

          {/* Đối thủ (Player 2) — đấu trường chỉ có đối thủ AI, phải nói rõ (changelog 0482). */}
          <div className="flex items-center justify-end gap-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-right">
            <div className="min-w-0 flex-1">
              {match.player2.isGhostBot && (
                <div className="text-[11px] font-black uppercase tracking-wide text-purple-300 theme-light:text-purple-800">
                  Đối thủ AI
                </div>
              )}
              <div className="text-xs font-bold text-purple-300 theme-light:text-purple-800 truncate">
                {match.player2.name}
              </div>
              <div className="text-lg sm:text-xl font-black text-white flex items-center justify-end gap-1.5">
                <span>{p2Score}</span>
                <span className="text-[11px] font-semibold text-purple-400 theme-light:text-purple-800">
                  pts
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-2xl flex items-center justify-center border border-purple-400/40 shrink-0">
              {match.player2.avatar}
            </div>
          </div>
        </div>

        {/* Trạng thái Kết Thúc Trận Đấu */}
        {isFinished ? (
          <div className="my-6 p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/30 border border-amber-400/50 flex items-center justify-center text-3xl shadow-xl mb-3">
              {p1Score >= p2Score ? '🏆' : '⚔️'}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {p1Score > p2Score
                ? 'VICTORY — CHIẾN THẮNG RỰC RỠ!'
                : p1Score === p2Score
                  ? 'HÒA KHÍ — TRẬN ĐẤU CÂN SỨC!'
                  : 'DEFEAT — CỐ GẮNG Ở TRẬN SAU!'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              Điểm chung cuộc:{' '}
              <strong className="text-amber-400 theme-light:text-amber-900">{p1Score}</strong> vs{' '}
              <strong className="text-zinc-400">{p2Score}</strong>
            </p>

            <div className="my-4 flex items-center justify-center gap-4 text-xs font-bold">
              {/* Elo THẬT server vừa cộng/trừ vào hồ sơ (changelog 0482). Bản trước hiện số gán
                  cứng +16/0/-14 (thua ra "+-14") và "+120 Exp" không được cộng vào đâu cả. */}
              {eloDelta !== null && (
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 theme-light:text-amber-900 border border-amber-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                  <span>{formatEloDelta(eloDelta)} Elo</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="tap-44 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm shadow-xl transition active:scale-95"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          /* Khung Câu Hỏi & Đếm Ngược */
          currentQ && (
            <div className="my-3">
              {/* Thanh đồng hồ đếm ngược phản xạ */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 theme-light:text-amber-900">
                  <Timer className="w-4 h-4 animate-pulse" />
                  <span>Thời gian: {timeLeft}s</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                  <Flame className="w-3.5 h-3.5 text-orange-400 theme-light:text-orange-900" />
                  <span>Cấp độ: {currentQ.cefrLevel}</span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeLeft / (currentQ.timeLimitSec || 5)) * 100}%`,
                  }}
                />
              </div>

              {/* Nội dung câu hỏi */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 mb-4 shadow-inner">
                <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {currentQ.prompt}
                </h4>
                {currentQ.subPrompt && (
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 italic">
                    {currentQ.subPrompt}
                  </p>
                )}
              </div>

              {/* 4 Lựa chọn trắc nghiệm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQ.options.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === idx
                  const isCorrect = idx === currentQ.correctIndex
                  const isWrong = isSelected && !isCorrect

                  let btnStyle =
                    'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-700/60 text-zinc-200'

                  if (roundResult) {
                    if (isCorrect) {
                      btnStyle =
                        'bg-emerald-950/80 border-emerald-500 text-emerald-300 theme-light:text-emerald-900 shadow-lg shadow-emerald-500/20 font-bold'
                    } else if (isWrong) {
                      btnStyle =
                        'bg-rose-950/80 border-rose-500 text-rose-300 theme-light:text-rose-900 font-bold'
                    } else {
                      btnStyle = 'opacity-40 border-zinc-800 text-zinc-500'
                    }
                  } else if (isSelected) {
                    btnStyle =
                      'bg-amber-500/20 border-amber-400 text-amber-300 theme-light:text-amber-900 font-bold'
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSubmitting || selectedOption !== null}
                      onClick={() => handleOptionSelect(idx)}
                      className={`tap-44 text-left p-3.5 rounded-2xl border transition-all text-xs sm:text-sm flex items-center justify-between gap-2 active:scale-98 ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {roundResult && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
                      )}
                      {roundResult && isWrong && (
                        <XCircle className="w-4 h-4 text-rose-400 theme-light:text-rose-900 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Giải thích sau khi trả lời */}
              {roundResult?.showExplanation && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 theme-light:text-amber-900 animate-fade-in flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 theme-light:text-amber-900 shrink-0 mt-0.5" />
                  <div>
                    <strong>Giải thích:</strong> {currentQ.explanation}
                    <div className="mt-1 text-[11px] text-zinc-300">
                      Điểm bạn nhận: +{roundResult.p1Action?.pointsEarned || 0} pts | Đối thủ: +
                      {roundResult.p2Action?.pointsEarned || 0} pts
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>,
    document.body,
  )
}
