import React, { useState } from 'react'
import { Zap, Cloud, Cpu, ShieldCheck, X, Info } from 'lucide-react'
import { useEdgeAi } from '../../lib/edgeAi/useEdgeAi.js'

interface EdgeAiIndicatorProps {
  className?: string
}

export const EdgeAiIndicator: React.FC<EdgeAiIndicatorProps> = ({ className = '' }) => {
  const { capability, isInitializing } = useEdgeAi()
  const [showDetails, setShowDetails] = useState(false)

  if (isInitializing) return null

  const isWebGpu = capability.inferenceMode === 'webgpu'

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className={`tap-44-y inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
          isWebGpu
            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-800 border-emerald-500/30'
            : capability.inferenceMode === 'wasm'
              ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 theme-light:text-sky-800 border-sky-500/30'
              : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 border-zinc-700/60'
        } ${className}`}
        title="Nhấn để xem chi tiết Edge AI"
      >
        {isWebGpu ? (
          <Zap className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900" />
        ) : (
          <Cloud className="w-3.5 h-3.5 text-zinc-400" />
        )}
        <span>
          {isWebGpu
            ? 'Chấm ngay trên máy'
            : capability.inferenceMode === 'wasm'
              ? 'Chấm trên máy'
              : 'Chấm qua máy chủ'}
        </span>
      </button>

      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-scale-in text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900" />
                <h3 className="font-bold text-white text-sm">Hạ tầng trí tuệ biên (Edge AI)</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Chế độ xử lý:</span>
                  <span className="font-bold text-emerald-400 theme-light:text-emerald-900">
                    {capability.inferenceMode === 'webgpu'
                      ? 'Chấm ngay trên máy'
                      : capability.inferenceMode === 'wasm'
                        ? 'Chấm trên máy'
                        : 'Chấm qua máy chủ'}
                  </span>
                </div>
                {capability.adapterName && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Phần cứng xử lý:</span>
                    <span className="font-mono text-zinc-200 text-[11px] truncate max-w-[200px]">
                      {capability.adapterName}
                    </span>
                  </div>
                )}
                {capability.estimatedMemoryMb && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">RAM khả dụng:</span>
                    <span className="font-semibold text-zinc-200">
                      ~{Math.round(capability.estimatedMemoryMb / 1024)} GB
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-zinc-300 leading-relaxed text-[11px]">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900 shrink-0 mt-0.5" />
                  <span>
                    <strong>0ms Độ trễ mạng:</strong> Phân loại ý định, gợi ý câu và kiểm tra lỗi
                    ngay tức thì khi bạn đang gõ phím.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400 theme-light:text-sky-900 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bảo mật Tuyệt đối:</strong> Dữ liệu nháp và vi tác vụ được xử lý 100%
                    trong thiết bị mà không truyền lên mạng.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-400 theme-light:text-purple-800 shrink-0 mt-0.5" />
                  <span>
                    <strong>Tiết kiệm Token:</strong> Tối ưu 70% chi phí AI Cloud cho các bài toán
                    suy luận dài hạn.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 text-right">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EdgeAiIndicator
