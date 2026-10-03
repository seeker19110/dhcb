import { useEffect, useState } from 'react'
import {
  Play,
  Square,
  Zap,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Volume2,
  AlertTriangle,
} from 'lucide-react'
import { ShadowingPassageSchema } from '@dhcb/core-contracts/echoShadowing'
import LoadError from '../LoadError'
import { useCatalogList } from '../../lib/useCatalogList'
import { speak, stopSpeaking } from '../../lib/tts'

// Phương pháp nói đuổi 3 pha (skill `multimodal-realtime-voice-master` mục 5). Thẻ KHÔNG ghi âm và
// KHÔNG chấm điểm: bản trước hiện "Band" tính từ số `Math.random()` (changelog 0484) — học viên tự
// so giọng mình với bản mẫu.
const SHADOWING_PHASES = [
  {
    title: 'Nghe chủ động',
    guide: 'Nghe mẫu 1–2 lần, mắt nhìn theo chữ. Để ý chỗ nhấn giọng và chỗ ngắt hơi.',
    playLabel: 'Nghe mẫu',
  },
  {
    title: 'Nói đuổi',
    guide:
      'Phát mẫu rồi nói theo ngay sau giọng đọc, chậm hơn khoảng nửa giây. Chưa cần đúng từng từ — giữ nhịp là chính.',
    playLabel: 'Phát mẫu để nói đuổi',
  },
  {
    title: 'Tự nói',
    guide:
      'Tự đọc to cả đoạn, không nghe mẫu. Xong thì nghe lại mẫu để so: chỗ nào nhịp hoặc âm của bạn còn khác?',
    playLabel: 'Nghe lại mẫu để so',
  },
] as const

export default function EchoShadowingCard() {
  // Danh sách bài mẫu: trạng thái tải/lỗi/rỗng tách bạch (trước đây lỗi tải để thân thẻ trống trơn).
  const { state: catalog, retry: retryCatalog } = useCatalogList(
    '/api/echo-shadowing',
    'passages',
    ShadowingPassageSchema,
  )
  const passages = catalog.status === 'ready' ? catalog.items : []
  const [selectedId, setSelectedId] = useState<string>('jobs_stanford_commencement')
  const [phase, setPhase] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playError, setPlayError] = useState<string | null>(null)

  const currentPassage = passages.find((p) => p.id === selectedId) || passages[0]
  const currentPhase = SHADOWING_PHASES[phase] ?? SHADOWING_PHASES[0]
  const isLastPhase = phase === SHADOWING_PHASES.length - 1

  // Rời thẻ thì dừng giọng đọc đang phát.
  useEffect(() => () => stopSpeaking(), [])

  const resetPractice = () => {
    stopSpeaking()
    setIsPlaying(false)
    setPhase(0)
    setPlayError(null)
  }

  const handlePlay = async () => {
    if (!currentPassage) return
    if (isPlaying) {
      stopSpeaking()
      setIsPlaying(false)
      return
    }
    setPlayError(null)
    setIsPlaying(true)
    try {
      await speak(currentPassage.targetText, 'en-US')
    } catch {
      setPlayError('Chưa phát được giọng mẫu. Kiểm tra loa/kết nối rồi thử lại nhé.')
    } finally {
      setIsPlaying(false)
    }
  }

  return (
    <div className="bg-surface-card border border-sky-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-line-subtle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-[#fff]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-bold text-white tracking-wide">Nói Đè Theo Mẫu</h3>
              <span className="text-[11px] px-2 py-0.5 font-bold uppercase rounded-full bg-sky-500/20 text-sky-200 theme-light:text-sky-900 border border-sky-500/30">
                Phản xạ tức thì
              </span>
            </div>
            <p className="text-xs text-content-secondary">
              Luyện phản xạ tai–miệng theo 3 pha: nghe, nói đuổi, tự nói
            </p>
          </div>
        </div>

        {phase > 0 && (
          <button
            onClick={resetPractice}
            className="tap-44 p-1.5 text-content-secondary hover:text-content hover:bg-surface-raised rounded-lg transition-colors"
            title="Luyện lại từ pha 1"
            aria-label="Luyện lại từ pha 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {catalog.status === 'loading' && (
        <p role="status" className="mt-4 text-xs text-content-secondary">
          Đang tải bài mẫu…
        </p>
      )}
      {catalog.status === 'error' && (
        <div className="mt-4">
          <LoadError
            message={catalog.message}
            hint="Tiến độ học của bạn không bị ảnh hưởng — chỉ danh sách bài mẫu chưa tải được."
            onRetry={retryCatalog}
          />
        </div>
      )}
      {catalog.status === 'ready' && passages.length === 0 && (
        <p className="mt-4 text-xs text-content-secondary">
          Chưa có bài mẫu nào để luyện. Hãy quay lại sau.
        </p>
      )}

      {/* Passage Selector — chỉ dựng khi có bài, tránh khoảng trống thừa ở trạng thái tải/lỗi/rỗng */}
      {passages.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {passages.map((p) => {
            const isSelected = p.id === selectedId
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id)
                  resetPractice()
                }}
                aria-pressed={isSelected}
                className={`tap-44-y px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-sky-950/60 theme-light:bg-sky-100 border-sky-400 text-sky-200 theme-light:text-sky-900 shadow-md shadow-sky-500/20'
                    : 'bg-surface-raised border-line-subtle text-content-secondary hover:text-content'
                }`}
              >
                {p.title.split('—')[0]}
              </button>
            )
          })}
        </div>
      )}

      {currentPassage && (
        <div className="mt-4 space-y-4">
          {/* Target Text Box */}
          <div className="p-4 rounded-xl bg-surface-raised border border-line-subtle space-y-2">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span className="font-semibold text-content-secondary">{currentPassage.title}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-raised text-content-secondary">
                Nhịp {currentPassage.bpmPacing} BPM
              </span>
            </div>
            <p className="text-sm font-medium text-content leading-relaxed italic">
              &ldquo;{currentPassage.targetText}&rdquo;
            </p>
          </div>

          {/* Bài luyện 3 pha */}
          <ol className="grid grid-cols-3 gap-2" aria-label="Các pha luyện nói đuổi">
            {SHADOWING_PHASES.map((p, i) => (
              <li
                key={p.title}
                aria-current={i === phase ? 'step' : undefined}
                className={`p-2 rounded-lg border text-center text-xs font-semibold ${
                  i === phase
                    ? 'bg-sky-950/60 theme-light:bg-sky-100 border-sky-400 text-sky-200 theme-light:text-sky-900'
                    : 'bg-surface-raised border-line-subtle text-content-secondary'
                }`}
              >
                {i + 1}. {p.title}
              </li>
            ))}
          </ol>

          <div className="p-4 rounded-xl bg-surface-raised border border-line-subtle space-y-3">
            <div className="flex items-start gap-2">
              <Volume2
                className="w-4 h-4 mt-0.5 shrink-0 text-sky-400 theme-light:text-sky-900"
                aria-hidden
              />
              <p className="text-sm text-content leading-relaxed">{currentPhase.guide}</p>
            </div>
            <button
              onClick={handlePlay}
              className="w-full py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-[#fff]"
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Dừng giọng mẫu</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{currentPhase.playLabel}</span>
                </>
              )}
            </button>
          </div>

          {playError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2"
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0 text-red-400 theme-light:text-red-900"
                aria-hidden
              />
              <p className="text-xs text-content">{playError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setPhase((p) => Math.max(0, p - 1))}
              disabled={phase === 0}
              className="tap-44-y flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-line-subtle bg-surface-raised text-content-secondary hover:text-content disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Pha trước
            </button>
            {isLastPhase ? (
              <button
                onClick={resetPractice}
                className="tap-44-y flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-sky-400 bg-sky-950/60 theme-light:bg-sky-100 text-sky-200 theme-light:text-sky-900 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-4 h-4" aria-hidden />
                Luyện lại từ đầu
              </button>
            ) : (
              <button
                onClick={() => setPhase((p) => Math.min(SHADOWING_PHASES.length - 1, p + 1))}
                className="tap-44-y flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-sky-400 bg-sky-950/60 theme-light:bg-sky-100 text-sky-200 theme-light:text-sky-900 flex items-center justify-center gap-1"
              >
                Pha tiếp
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>

          <p className="text-xs text-content-secondary">
            Thẻ này không ghi âm và không chấm điểm — bạn tự so giọng mình với bản mẫu.
          </p>
        </div>
      )}
    </div>
  )
}
