// src/pages/AvatarDemo.tsx — PoC "avatar AI nói chuyện" (mô phỏng khẩu hình theo audio TTS).
// Trang DEMO ẨN — CHỈ ADMIN, vào qua URL trực tiếp (/avatar-demo), KHÔNG có trong menu/BottomNav,
// KHÔNG gắn vào luồng Luyện nói thật. Xem docs/research/dac-ta-avatar-ai-noi-chuyen-2026-07-28.md
// (mục 5, bước 1 "PoC nhỏ") — chứng minh cơ chế viseme animation chạy đúng trước khi mở rộng.
import { MAIN_CONTENT_ID } from '@core/PageShell'
import { useState } from 'react'
import { usePageTitle } from '../../lib/usePageTitle'
import Layout from '../../components/Layout'
import ComingSoonBanner from '../../components/ComingSoonBanner'
import AvatarSpeaking from '../../components/AvatarSpeaking'
import { ensureAudioWithTimeline, bufferToBlobUrl, DEFAULT_VOICE } from '../../lib/tts'
import {
  fallbackWordVisemes,
  framesFromWordVisemes,
  type Viseme,
  type VisemeFrame,
} from '../../lib/viseme'
import { getStoredToken, getAuthHeader } from '@core/authHeader'
import { useToast } from '@core/ToastProvider'

const DEMO_SENTENCE = 'Hello, how are you today? I am your English tutor.'

// Hỏi server dãy viseme thật (eSpeak-ng, xem api/avatar-visemes.ts) — trả null nếu server chưa
// cài eSpeak-ng hoặc lỗi mạng, để dùng fallbackWordVisemes() (đếm nguyên âm chữ viết) thay thế.
async function fetchWordVisemes(text: string): Promise<Viseme[][] | null> {
  try {
    const token = getStoredToken()
    if (!token) return null
    const res = await fetch('/api/avatar-visemes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ text, lang: 'en-US' }),
    })
    if (!res.ok) return null
    const { wordVisemes } = (await res.json()) as { wordVisemes: Viseme[][] | null }
    return wordVisemes
  } catch {
    return null
  }
}

export default function AvatarDemo() {
  usePageTitle('Demo avatar | Đồng hành cùng bạn')
  // Dùng state (không dùng ref) vì phần tử audio được TRUYỀN XUỐNG AvatarSpeaking lúc render
  // — luật react-hooks refs cấm đọc ref.current trong render.
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null)
  const [timeline, setTimeline] = useState<VisemeFrame[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function handlePlay() {
    if (loading || isPlaying) return
    setLoading(true)
    try {
      const words = DEMO_SENTENCE.split(/\s+/).filter(Boolean)
      // `timeline` từ server là mốc thời gian THẬT (giọng ElevenLabs, xem
      // api/_lib/visemeTimeline.ts) — chính xác hơn hẳn cách ước lượng bên dưới. Chỉ khi
      // không có mới cần hỏi phoneme rồi chia đều thời lượng như trước.
      const { buffer, timeline: serverTimeline } = await ensureAudioWithTimeline(
        DEMO_SENTENCE,
        'en-US',
        DEFAULT_VOICE,
      )
      const wordVisemes = serverTimeline ? null : await fetchWordVisemes(DEMO_SENTENCE)
      const blobUrl = bufferToBlobUrl(buffer)

      const audio = audioEl ?? new Audio()
      setAudioEl(audio)
      audio.src = blobUrl

      if (serverTimeline && serverTimeline.length > 0) {
        setTimeline(serverTimeline)
        audio.onloadedmetadata = null
      } else {
        // Ước lượng cần biết thời lượng audio thật → phải đợi metadata tải xong.
        audio.onloadedmetadata = () => {
          const durationMs = audio.duration * 1000
          const frames = framesFromWordVisemes(
            wordVisemes ?? fallbackWordVisemes(words),
            durationMs,
          )
          setTimeline(frames)
        }
      }
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(blobUrl)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        toast.error('Không phát được audio demo')
      }

      await audio.play()
      setIsPlaying(true)
    } catch (err) {
      console.error('[AvatarDemo] Lỗi phát demo:', err)
      toast.error('Không tạo được audio demo — kiểm tra đăng nhập/kết nối mạng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Layout title="Thử nghiệm — Avatar AI nói chuyện" />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="focus:outline-none max-w-lg mx-auto px-4 pt-6 pb-[calc(2rem+var(--bnav-h))]"
      >
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Thử nghiệm — Avatar AI nói chuyện
        </h1>
        <ComingSoonBanner
          isA
          note="Avatar AI nói chuyện đang ở giai đoạn thử nghiệm: mới chứng minh cơ chế khẩu hình chạy đúng, chưa nối vào luồng Luyện nói thật. Bản hoàn chỉnh sẽ ra mắt sau."
        />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center gap-5">
          <AvatarSpeaking audioEl={audioEl} timeline={timeline} isPlaying={isPlaying} />
          <p className="text-sm text-zinc-400 text-center max-w-sm">{DEMO_SENTENCE}</p>
          <button
            type="button"
            onClick={handlePlay}
            disabled={loading || isPlaying}
            className="min-h-11 px-6 rounded-full bg-accent-500 text-[#09090b] font-medium disabled:opacity-50"
          >
            {loading ? 'Đang tạo audio…' : isPlaying ? 'Đang nói…' : 'Phát demo'}
          </button>
        </div>
      </main>
    </>
  )
}
