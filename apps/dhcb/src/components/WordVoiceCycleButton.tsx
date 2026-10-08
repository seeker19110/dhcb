import { useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { useToast } from '@core/ToastProvider'
import { getVoicePref, playAudioUrl, type Voice } from '../lib/tts'
import { VOICE_OPTIONS, resolveActualVoice } from '../lib/voiceTiers'
import { fetchPronunciation } from '../lib/pronunciationApi'

interface Props {
  word: string
  lang?: 'en-US' | 'vi-VN' // bỏ trống = tiếng Anh (mặc định cũ, giữ tương thích chỗ gọi chưa sửa)
  isA?: boolean // true = giao diện tiếng Việt (chiều A) · false = tiếng Anh (chiều B)
}

// Nhãn ngắn gọn cho từng giọng (tên riêng + nhãn giới tính), hiển thị cạnh icon để người
// dùng biết đang nghe giọng nào. Nhãn giới tính theo CHIỀU HỌC như VoicePicker —
// trước đây viết cứng tiếng Việt nên người học chiều B (giao diện tiếng Anh) vẫn thấy "Nữ".
function voiceLabel(voice: Voice, isA: boolean): string {
  const gender = VOICE_OPTIONS.find((v) => v.id === voice)?.gender ?? 'female'
  const genderLabel = gender === 'female' ? (isA ? 'Nữ' : 'Female') : isA ? 'Nam' : 'Male'
  // [2026-09-22] Không in tên giọng nội bộ của Google ("Kore", "Puck"…): người học chỉ cần
  // biết đang nghe giọng nam hay nữ.
  return isA ? `Giọng ${genderLabel.toLowerCase()}` : `${genderLabel} voice`
}

// Nút DUY NHẤT phát âm 1 từ ở thẻ học từ mới/SRS/Hôm nay (WordCard.tsx).
// [Sửa 2026-08-13] Trước đây (quyết định 2026-07-29) mỗi lần bấm bốc NGẪU NHIÊN 1 giọng,
// khác hẳn giọng đã chọn ở Cài đặt (VoicePicker) — người dùng báo đây là lỗi: chọn giọng cụ
// thể ở Cài đặt không có tác dụng gì ở màn học. NAY: luôn dùng ĐÚNG `getVoicePref()` — giọng
// cố định đã lưu khi tắt "Giọng ngẫu nhiên", hoặc giọng ngẫu nhiên GIỮ NGUYÊN trong phiên khi
// bật (xem tts.ts#getVoicePref) — khớp hành vi với KaraokeText/StudyTabs đang dùng đúng.
// Giọng random-mỗi-lần-bấm (không liên quan Cài đặt) vẫn còn ở Từ điển (PronounceButton).
export default function WordVoiceCycleButton({ word, lang = 'en-US', isA = true }: Props) {
  const [loading, setLoading] = useState(false)
  // Cache audio_url theo từng giọng đã tải — đổi giọng ở Cài đặt rồi quay lại giọng cũ thì
  // không gọi lại API.
  const [audioUrls, setAudioUrls] = useState<Partial<Record<Voice, string>>>({})
  // Giọng đang hiển thị nhãn — luôn theo giọng THẬT vừa phát (có thể bị server hạ theo gói).
  const [currentVoice, setCurrentVoice] = useState<Voice>(getVoicePref)
  const toast = useToast()

  // Dự phòng Web Speech API khi /api/pronunciation lỗi — nút này giờ là nút loa DUY NHẤT
  // của thẻ nên phải có fallback như PronounceButton trước đây, không im lặng bỏ qua nữa.
  function speakWithWebSpeech(voice: Voice) {
    if (!('speechSynthesis' in window)) return
    const gender = VOICE_OPTIONS.find((v) => v.id === voice)?.gender ?? 'female'
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = lang
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith(lang.slice(0, 2)) &&
        (gender === 'male'
          ? v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('nam')
          : v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('nữ')),
    )
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  async function handleClick() {
    if (loading) return

    // Giọng đã chọn ở Cài đặt — cố định (VoicePicker) hoặc random-giữ-nguyên-trong-phiên nếu
    // bật "Giọng ngẫu nhiên" (xem tts.ts#getVoicePref, đã tự xử lý cả 2 trường hợp).
    const voice = getVoicePref()

    // Tra cache theo giọng ĐOÁN trước (voice) — nếu đã có nghĩa là lần trước server cũng trả
    // về đúng giọng này (không bị hạ gói), nên vừa tra cache vừa hiện nhãn ngay được.
    const cached = audioUrls[voice]
    if (cached) {
      setCurrentVoice(voice)
      playAudioUrl(cached)
      return
    }

    setLoading(true)
    const result = await fetchPronunciation(word, voice, lang)
    setLoading(false)

    if (result.kind === 'ok') {
      // Server có thể đã HẠ giọng đoán (voice) xuống giọng khác nếu ngoài quyền gói hiện tại
      // (clampVoiceToPlan) — PHẢI hiện nhãn theo giọng server THẬT SỰ dùng, không phải giọng
      // client đoán, nếu không nhãn sẽ lệch với audio thật (bug đã gặp: cache voice_allowed
      // phía client lệch/rộng hơn gói thật).
      const actualVoice = resolveActualVoice(voice, result.voice)
      setCurrentVoice(actualVoice)
      // Cache theo giọng THẬT (actualVoice), không phải giọng đoán (voice) — tránh đọc nhầm
      // cache giữa 2 giọng khi server từng hạ gói.
      const audioUrl = result.audioUrl
      setAudioUrls((prev) => ({ ...prev, [actualVoice]: audioUrl }))
      playAudioUrl(audioUrl)
      return
    }

    // Hết lượt AI / quá nhiều yêu cầu: HIỆN câu thông báo của server (không nuốt), rồi vẫn đọc
    // bằng Web Speech để thẻ học không bị câm.
    if (result.kind === 'refused') {
      toast.info(result.message)
    } else {
      console.error('Lỗi nghe giọng, dùng tạm Web Speech:', result.message)
    }
    setCurrentVoice(voice)
    speakWithWebSpeech(voice)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={isA ? 'Nghe' : 'Listen'}
      aria-label={isA ? 'Nghe' : 'Listen'}
      className="tap-44 shrink-0 h-10 px-3.5 flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-accent-500/20 text-zinc-300 hover:text-accent-300 transition disabled:opacity-60 text-sm font-medium"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
      <span>{voiceLabel(currentVoice, isA)}</span>
    </button>
  )
}
