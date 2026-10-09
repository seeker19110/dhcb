// apps/dhcb/src/pages/subjects/english/lessons/useRolePlay.ts — state + logic chế độ "Đóng vai",
// tách từ LessonView.tsx (2026-09-06). Mã trong hook GIỮ NGUYÊN, chỉ đổi chỗ: thứ hook cần từ
// trình phát (ref tốc độ/giọng, đặt dòng đang đọc, sáng chữ) nhận qua tham số.
//
// [S09c, 2026-09-24 — spec §2.7 mục 5] THẾ HỆ (generation) thay cờ `rpStopRef`: mỗi lần bắt
// đầu/dừng/điều hướng tăng `theHeRef`; mọi đoạn mã chạy SAU một `await` (TTS, micro, STT, chấm
// điểm) so lại thế hệ đã chụp và bỏ cuộc nếu đã khác. Cờ boolean cũ có lỗ: "Dừng" rồi "Đọc lại"
// nhanh thì vòng cũ thấy cờ đã về `false` và chạy song song với vòng mới; phản hồi chấm điểm
// về sau khi rời bài vẫn cộng lượt dùng. Hook sống theo MỘT bài/owner/chiều học (trang đặt
// `key` cho LessonView), nên kết quả chấm chỉ thuộc đúng bài/owner/chiều đó.
import { thongDiepLoiThanThien } from '../../../../lib/friendlyError'
import { useState, useRef, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { getUsage, incrementUsage } from '../../../../lib/storage'
import { speak, stopSpeaking, unlockAudio, type Voice } from '../../../../lib/tts'
import { type Lesson } from '../../../../data/lessons/loader'
import type { Plan, EvaluationResult } from '../../../../types'
import { startRecording, isRecordingSupported, type Recorder } from '../../../../lib/sttServer'
import { callClaude, parseJson } from '../../../../lib/ai'
import { speakingFullEvaluationPrompt } from '../../../../prompts'
import { effectivePlan } from '../../../../lib/promo'
import { isFeatureEnabled } from '../../../../lib/planFeatures'
import { hasReachedDailyLimit } from '../../../../lib/appSettings'
import { useApiThrottle } from '../../../../lib/useApiThrottle'
import type { Speed, WordSync } from './shared'

type Params = {
  lesson: Lesson
  isA: boolean
  plan: Plan
  userId: string
  /** Ref tốc độ/giọng của trình phát — đọc `.current` lúc phát để không bị closure cũ */
  speedRef: MutableRefObject<Speed>
  voiceARef: MutableRefObject<Voice>
  voiceBRef: MutableRefObject<Voice>
  setActiveTurn: (idx: number | null) => void
  syncWord: (ws: WordSync | null) => void
}

export function useRolePlay({
  lesson,
  isA,
  plan,
  userId,
  speedRef,
  voiceARef,
  voiceBRef,
  setActiveTurn,
  syncWord,
}: Params) {
  // ── Chế độ "Đóng vai" ─────────────────────────────────────────────────────
  // Người dùng chọn 1 vai (A hoặc B) → dòng của vai kia AI đọc bằng TTS như bình thường,
  // dòng của vai người dùng thì DỪNG lại chờ họ bấm ghi âm và tự đọc. Hết hội thoại → gọi
  // AI chấm điểm 1 lần bằng đúng prompt speakingFullEvaluationPrompt() đang dùng ở trang
  // Luyện nói. Giống hệt cách làm ở DialogueView (src/components/CefrLessonViews.tsx),
  // chỉ đổi tên trường dữ liệu cho khớp Lesson/Turn. Bật/tắt qua ma trận tính năng theo gói
  // (feature key "dialogue_roleplay", dùng chung với /learning-path).
  const isPro = isFeatureEnabled(effectivePlan(plan), 'dialogue_roleplay')
  const canRecord = isRecordingSupported()
  const [rolePlay, setRolePlay] = useState<{ role: 'A' | 'B' } | null>(null)
  const [rolePicker, setRolePicker] = useState(false)
  const [rpIdx, setRpIdx] = useState<number | null>(null)
  const [rpRecording, setRpRecording] = useState(false)
  const [rpTranscribing, setRpTranscribing] = useState(false)
  const [rpTranscripts, setRpTranscripts] = useState<Record<number, string>>({})
  const [rpFinished, setRpFinished] = useState(false)
  const [rpEvaluating, setRpEvaluating] = useState(false)
  const [rpEvaluation, setRpEvaluation] = useState<EvaluationResult | null>(null)
  const [rpError, setRpError] = useState('')
  // Thế hệ phiên đóng vai hiện hành — xem chú thích đầu file.
  const theHeRef = useRef(0)
  const rpRecorderRef = useRef<Recorder | null>(null)
  const rpResolveRef = useRef<((text: string) => void) | null>(null)
  const rpWordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { isThrottled: rpThrottled, throttle: rpThrottle } = useApiThrottle()

  function stopWordPacer() {
    if (rpWordTimerRef.current) {
      clearInterval(rpWordTimerRef.current)
      rpWordTimerRef.current = null
    }
  }
  // "Sáng chữ theo tốc độ người đọc": không có mốc thời gian thật của giọng người dùng
  // (STT chỉ trả text sau khi ghi xong) nên ước lượng bằng nhịp đều theo tốc độ đang chọn.
  function startWordPacer(turnIdx: number, text: string, lang: 'en' | 'vi') {
    stopWordPacer()
    const words = text.split(/\s+/).filter(Boolean)
    if (words.length === 0) return
    let wi = 0
    syncWord({ turnIdx, lang, wordIdx: 0 })
    const msPerWord = Math.max(120, 320 / speedRef.current)
    rpWordTimerRef.current = setInterval(() => {
      wi++
      if (wi >= words.length) {
        stopWordPacer()
        return
      }
      syncWord({ turnIdx, lang, wordIdx: wi })
    }, msPerWord)
  }

  function waitForUserTurn(i: number, text: string, lang: 'en' | 'vi'): Promise<string> {
    return new Promise((resolve) => {
      rpResolveRef.current = resolve
      startWordPacer(i, text, lang)
    })
  }

  async function beginRolePlayRecording() {
    if (!canRecord || rpIdx === null || rpRecording) return
    unlockAudio()
    const the = theHeRef.current
    try {
      const rec = await startRecording(isA ? 'en' : 'vi')
      // Đã điều hướng/dừng trong lúc chờ quyền micro → nhả micro ngay, không gắn vào phiên mới.
      if (the !== theHeRef.current) {
        rec.cancel()
        return
      }
      rpRecorderRef.current = rec
      setRpRecording(true)
    } catch {
      if (the !== theHeRef.current) return
      setRpError(
        isA
          ? 'Không mở được micro. Kiểm tra quyền truy cập trình duyệt.'
          : 'Could not access microphone. Check browser permissions.',
      )
    }
  }

  async function finishRolePlayRecording() {
    const rec = rpRecorderRef.current
    if (!rec) return
    const the = theHeRef.current
    // Bộ ghi đã được "dừng" (đang chờ STT) → nhả khỏi ref NGAY, để lệnh huỷ khi điều hướng không
    // gọi stop/cancel lần hai lên cùng một bộ ghi (có thể phát `onstop` lần nữa → gửi STT lần 2).
    rpRecorderRef.current = null
    setRpRecording(false)
    setRpTranscribing(true)
    stopWordPacer()
    let text = ''
    try {
      text = await rec.stop()
    } catch {
      text = ''
    }
    // STT về sau khi đã điều hướng: bỏ transcript, KHÔNG đánh thức vòng đóng vai (nó đã bị huỷ).
    if (the !== theHeRef.current) return
    setRpTranscribing(false)
    rpResolveRef.current?.(text)
    rpResolveRef.current = null
  }

  function skipRolePlayLine() {
    stopWordPacer()
    if (rpRecorderRef.current) {
      rpRecorderRef.current.cancel()
      rpRecorderRef.current = null
    }
    setRpRecording(false)
    rpResolveRef.current?.('')
    rpResolveRef.current = null
  }

  async function startRolePlay(role: 'A' | 'B') {
    unlockAudio()
    // Phiên mới: vô hiệu mọi chuỗi cũ còn treo (vd bấm "Đọc lại" khi vòng trước chưa kịp thoát).
    huyChuoi()
    const the = theHeRef.current
    const conHieuLuc = () => the === theHeRef.current
    setRolePicker(false)
    setRolePlay({ role })
    setRpFinished(false)
    setRpEvaluation(null)
    setRpError('')
    setRpTranscripts({})
    setActiveTurn(null)
    syncWord(null)

    for (let i = 0; i < lesson.turns.length; i++) {
      if (!conHieuLuc()) return
      const t = lesson.turns[i]
      if (!t) continue
      setActiveTurn(i)
      syncWord(null)
      const displayText = isA ? t.en : t.vi
      const displayLang: 'en' | 'vi' = isA ? 'en' : 'vi'

      if (t.speaker === role) {
        setRpIdx(i)
        const text = await waitForUserTurn(i, displayText, displayLang)
        if (!conHieuLuc()) return
        setRpIdx(null)
        setRpTranscripts((prev) => ({ ...prev, [i]: text }))
      } else {
        const v = t.speaker === 'A' ? voiceARef.current : voiceBRef.current
        const lang = isA ? 'en-US' : 'vi-VN'
        await speak(displayText, lang, v, speedRef.current, (wi) =>
          syncWord({ turnIdx: i, lang: displayLang, wordIdx: wi }),
        )
        if (!conHieuLuc()) return
        await new Promise((r) => setTimeout(r, 400))
      }
    }

    if (!conHieuLuc()) return
    setActiveTurn(null)
    syncWord(null)
    setRpIdx(null)
    setRpFinished(true)
  }

  // Huỷ phần "đang chạy" (không đụng state React): tăng thế hệ, dừng giọng đọc/nhịp sáng chữ,
  // huỷ ghi âm (nhả micro, không gửi STT) và đánh thức lời chờ lượt người dùng để vòng cũ thoát.
  function huyChuoi() {
    theHeRef.current++
    stopWordPacer()
    stopSpeaking()
    if (rpRecorderRef.current) {
      rpRecorderRef.current.cancel()
      rpRecorderRef.current = null
    }
    rpResolveRef.current?.('')
    rpResolveRef.current = null
  }

  function stopRolePlay() {
    huyChuoi()
    setRpRecording(false)
    setRpTranscribing(false)
    setRolePlay(null)
    setRpFinished(false)
    setRpIdx(null)
    setActiveTurn(null)
    syncWord(null)
  }

  /**
   * Trang vừa áp một điều hướng (đổi hash/đích): phiên đóng vai đang chạy KẾT THÚC CHƯA HOÀN
   * THÀNH — không thành "bỏ qua có điểm", không mở thanh chấm; lượt chấm đang chờ bị bỏ (phản
   * hồi về sau không hiện, không cộng lượt). Kết quả ĐÃ có của lần mở bài này thì giữ nguyên.
   * Muốn phát/ghi lại phải bấm rõ ràng.
   */
  function huyTheoDieuHuong() {
    stopRolePlay()
    setRolePicker(false)
    setRpTranscripts({})
    setRpEvaluating(false)
    setRpError('')
  }

  function closeRolePlayResult() {
    setRolePlay(null)
    setRpFinished(false)
    setRpEvaluation(null)
    setRpTranscripts({})
    setActiveTurn(null)
  }

  async function gradeRolePlay() {
    if (rpEvaluating || !rolePlay) return
    const usage = getUsage(userId)
    const planForLimit = effectivePlan(plan)
    if (planForLimit !== 'free' && hasReachedDailyLimit(usage, planForLimit)) {
      setRpError(
        isA
          ? 'Bạn đã dùng hết lượt chấm điểm hôm nay. Thử lại vào ngày mai nhé.'
          : "You've used all your grading turns today. Try again tomorrow.",
      )
      return
    }
    if (rpThrottled) return
    const the = theHeRef.current
    setRpEvaluating(true)
    setRpError('')
    const role = rolePlay.role
    const sys = speakingFullEvaluationPrompt(isA ? 'A' : 'B')
    const history = lesson.turns.map((t, i) => ({
      role: t.speaker === role ? ('user' as const) : ('assistant' as const),
      content: t.speaker === role ? (rpTranscripts[i] ?? '') : isA ? t.en : t.vi,
    }))
    try {
      const raw = await callClaude(history, sys, 2048, 'speaking', 'grade')
      // Đã rời phiên (điều hướng/đổi bài/owner) khi đang chấm → bỏ phản hồi: không hiện điểm,
      // không cộng lượt. Lượt gọi AI đã tốn thì không lấy lại được, nhưng không "ghi điểm" sai chỗ.
      if (the !== theHeRef.current) return
      const data = parseJson<EvaluationResult>(raw)
      if (!data) {
        throw new Error(
          isA
            ? 'AI trả về định dạng không đúng. Thử lại.'
            : 'AI returned invalid format. Please try again.',
        )
      }
      setRpEvaluation(data)
      incrementUsage(userId, 'speakingCount')
      rpThrottle()
    } catch (e) {
      if (the !== theHeRef.current) return
      setRpError(
        thongDiepLoiThanThien(e, isA ? 'Lỗi không xác định' : 'Unknown error', isA ? 'vi' : 'en'),
      )
    }
    setRpEvaluating(false)
  }

  // Rời màn hình (đổi bài/owner/chiều → trang remount LessonView): huỷ mọi chuỗi còn treo.
  // Chỉ đụng ref — setState sau khi unmount là vô nghĩa.
  useEffect(
    () => () => {
      theHeRef.current++
      stopWordPacer()
      if (rpRecorderRef.current) rpRecorderRef.current.cancel()
      rpRecorderRef.current = null
      rpResolveRef.current?.('')
      rpResolveRef.current = null
    },
    [],
  )

  return {
    isPro,
    canRecord,
    rolePlay,
    rolePicker,
    setRolePicker,
    rpIdx,
    rpRecording,
    rpTranscribing,
    rpFinished,
    rpEvaluating,
    rpEvaluation,
    rpError,
    rpThrottled,
    startRolePlay,
    stopRolePlay,
    huyTheoDieuHuong,
    closeRolePlayResult,
    gradeRolePlay,
    beginRolePlayRecording,
    finishRolePlayRecording,
    skipRolePlayLine,
  }
}
