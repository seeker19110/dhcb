import React, { useState } from 'react'
import { useDialogBehavior } from '../useDialogBehavior'
import { Sparkles, X, Loader2, ArrowRight } from 'lucide-react'

interface CanvasAiOrchestratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSynthesize: (prompt: string) => Promise<void>
}

const SAMPLE_GOALS = [
  'Đạt IELTS 7.5 và Apply học bổng Thạc sĩ Trí tuệ Nhân tạo 2027',
  'Chuyển ngành từ Marketer sang Product Manager công nghệ',
  'Ra mắt sản phẩm MVP EdTech trong 6 tháng và gọi vốn 50,000$',
  'Cân bằng công việc Senior Developer với rèn luyện thể lực & học tiếng Anh',
]

export default function CanvasAiOrchestratorModal({
  isOpen,
  onClose,
  onSynthesize,
}: CanvasAiOrchestratorModalProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  // 6 hành vi a11y bắt buộc của hộp thoại (Escape, bẫy tiêu điểm, khoá cuộn nền…).
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose, isOpen)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return
    setLoading(true)
    try {
      await onSynthesize(prompt.trim())
      onClose()
    } catch {
      // Trang cha đã báo lỗi bằng toast — giữ hộp thoại mở, giữ câu mục tiêu để thử lại.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-zinc-900 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="tap-44 absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 theme-light:text-cyan-900 border border-cyan-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 id={titleId} className="text-base font-bold text-zinc-100">
              Tạo không gian hành động
            </h3>
            <p className="text-xs text-zinc-400">
              {/* Changelog 0485: `synthesize` dựng từ KHUNG MẪU cố định, không gọi AI — câu cũ "AI tự
                  động phân rã… 5 miền" nói sai cả hai ý. */}
              Tạo bản nháp sơ đồ từ khung mẫu: mục tiêu của bạn ở gốc, kèm vài nút gợi ý để bạn sửa,
              thêm, xoá.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="canvasaiorchestratormodal-nhap-muc-tieu-chien-luoc-hoac-du"
              className="block text-xs font-semibold text-zinc-300 mb-1.5"
            >
              Nhập mục tiêu chiến lược hoặc dự định của bạn:
            </label>
            <textarea
              id="canvasaiorchestratormodal-nhap-muc-tieu-chien-luoc-hoac-du"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="VD: Đạt IELTS 7.5 và chuẩn bị hồ sơ chuyển việc sang công ty công nghệ quốc tế..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-[0.6875rem] font-semibold text-zinc-400 mb-1.5">
              Gợi ý mục tiêu phổ biến:
            </span>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_GOALS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="flex items-center justify-between text-left text-xs p-2 rounded-lg bg-zinc-950 hover:bg-cyan-950/40 hover:text-cyan-300 border border-zinc-800/80 transition"
                >
                  <span className="line-clamp-1">{sample}</span>
                  <ArrowRight className="w-3 h-3 ml-2 flex-shrink-0 text-zinc-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-zinc-950 hover:bg-cyan-400 disabled:opacity-50 transition shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tạo sơ đồ...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Tạo bản nháp sơ đồ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
