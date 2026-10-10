import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Monitor, Eye, EyeOff, Sparkles, Lightbulb, Tag, Loader2, CheckCircle2 } from 'lucide-react'
import type { AmbientContextInsight } from '@dhcb/core-contracts/ambientContext'
import { buttonClass } from '@core/buttonStyles'

export const AmbientScreenCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [insight, setInsight] = useState<AmbientContextInsight | null>(null)
  const [autoCapture, setAutoCapture] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  // Bản sao của `stream` trong ref: listener 'ended' (người dùng bấm "Dừng chia sẻ" trên thanh của
  // TRÌNH DUYỆT) được gắn lúc `stream` state còn null — nếu stopScreenShare đọc state qua closure
  // thì nó không làm gì và panel kẹt ở "Đang bật" (audit 2026-10-10, đợt E4). Đọc ref thì callback
  // ổn định, luôn thấy luồng hiện tại.
  const streamRef = useRef<MediaStream | null>(null)

  const stopScreenShare = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStream(null)
    setAutoCapture(false)
  }, [])

  const startScreenShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Trình duyệt của bạn không hỗ trợ chia sẻ màn hình trực tiếp.')
        return
      }
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: false,
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      mediaStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopScreenShare()
      })
    } catch {
      // Người dùng hủy chọn màn hình
    }
  }

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !stream) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(video.videoWidth || 1280, 1280)
    canvas.height = Math.min(video.videoHeight || 720, 720)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const base64 = canvas.toDataURL('image/jpeg', 0.8)

    try {
      setAnalyzing(true)
      const res = await fetch('/api/ambient-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.insight) {
          setInsight(data.insight)
        }
      }
    } catch {
      // Bỏ qua lỗi
    } finally {
      setAnalyzing(false)
    }
  }, [stream])

  // Tự động phân tích định kỳ nếu bật Auto-Capture
  useEffect(() => {
    let kickoff: NodeJS.Timeout | null = null
    let timer: NodeJS.Timeout | null = null
    if (autoCapture && stream) {
      // Gọi lượt đầu qua setTimeout(0) — setState của captureAndAnalyze chạy trong
      // callback timer (async), không đồng bộ trong thân effect.
      kickoff = setTimeout(() => {
        void captureAndAnalyze()
      }, 0)
      timer = setInterval(() => {
        void captureAndAnalyze()
      }, 15_000)
    }
    return () => {
      if (kickoff) clearTimeout(kickoff)
      if (timer) clearInterval(timer)
    }
  }, [autoCapture, stream, captureAndAnalyze])

  useEffect(() => {
    return () => {
      stopScreenShare()
    }
  }, [stopScreenShare])

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden transition text-xs shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-800/50 transition"
      >
        {/* min-w-0 + flex-1: khối tiêu đề co lại/xuống dòng, nhường badge giữ nguyên một dòng ở 390px. */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`shrink-0 p-1.5 rounded-xl border ${
              stream
                ? 'bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 border-emerald-500/40 animate-pulse'
                : 'bg-zinc-800 text-sky-400 theme-light:text-sky-900 border-zinc-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-bold text-white text-xs block">
              Trợ Lý Nhìn Màn Hình (Ambient Screen Copilot)
            </span>
            <span className="text-[0.6875rem] text-zinc-400">
              {stream ? 'Đang quan sát ngữ cảnh làm việc trực tiếp' : 'Hỗ trợ không cần copy-paste'}
            </span>
          </div>
        </div>

        <span
          className={`shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold border ${
            stream
              ? 'bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          {stream ? 'Đang bật' : 'Chưa kích hoạt'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-zinc-800/80 space-y-4 animate-fade-in bg-zinc-950/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!stream ? (
                <button
                  onClick={startScreenShare}
                  className="tap-44 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-[#fff] font-semibold text-xs transition shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Bật chia sẻ màn hình</span>
                </button>
              ) : (
                <button
                  onClick={stopScreenShare}
                  className="tap-44 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 theme-light:text-rose-900 border border-rose-500/40 font-semibold text-xs transition"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Dừng quan sát</span>
                </button>
              )}

              {stream && (
                <button
                  onClick={captureAndAnalyze}
                  disabled={analyzing}
                  className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 theme-light:text-sky-900" />
                      <span>Đang phân tích…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 theme-light:text-sky-900" />
                      <span>Quét ngữ cảnh ngay</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {stream && (
              <label className="flex items-center gap-2 text-[0.6875rem] text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCapture}
                  onChange={(e) => setAutoCapture(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-sky-500 theme-light:text-sky-900 focus:ring-sky-500"
                />
                <span>Tự động quét mỗi 15 giây</span>
              </label>
            )}
          </div>

          {/* Hidden Video element for Canvas frame rendering */}
          <div
            className={`${stream ? 'block' : 'hidden'} relative rounded-xl overflow-hidden border border-zinc-800 bg-black max-h-48 flex items-center justify-center`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-48 w-full object-contain"
            />
            {analyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-sky-300 theme-light:text-sky-900 font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI đang đọc ngữ cảnh màn hình...</span>
              </div>
            )}
          </div>

          {/* Results and Insights */}
          {insight && (
            <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
              <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div>
                  <div className="text-[0.6875rem] font-bold text-sky-400 theme-light:text-sky-900">
                    Ứng dụng: <span className="text-zinc-200">{insight.detectedApp}</span> · Lĩnh
                    vực: <span className="text-zinc-200 capitalize">{insight.relevantDomain}</span>
                  </div>
                  <p className="text-zinc-200 font-medium text-xs mt-0.5">
                    {insight.summaryOfWork}
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-2">
                <div className="text-[0.6875rem] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 theme-light:text-amber-900" />
                  <span>Gợi ý trợ lực thông minh:</span>
                </div>
                <div className="space-y-1.5">
                  {insight.tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sky-300 theme-light:text-sky-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 theme-light:text-emerald-900" />
                          {tip.title}
                        </span>
                        <span className="text-[0.6875rem] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase font-mono">
                          {tip.type}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-[0.6875rem] leading-relaxed">
                        {tip.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              {insight.extractedKeywords.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <Tag className="w-3 h-3 text-zinc-500" />
                  {insight.extractedKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[0.6875rem]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AmbientScreenCopilot
