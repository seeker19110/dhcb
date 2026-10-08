import { useState } from 'react'
import { useDialogBehavior } from '../useDialogBehavior'
import { FileText, Copy, Check, X, Download } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'

interface CanvasExportModalProps {
  isOpen: boolean
  onClose: () => void
  markdown: string
  title: string
}

export default function CanvasExportModal({
  isOpen,
  onClose,
  markdown,
  title,
}: CanvasExportModalProps) {
  const [copied, setCopied] = useState(false)
  // 6 hành vi a11y bắt buộc của hộp thoại (Escape, bẫy tiêu điểm, khoá cuộn nền…).
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose, isOpen)

  if (!isOpen) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = (title.toLowerCase().replace(/\s+/g, '_') || 'action_canvas') + '.md'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="tap-44 absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 theme-light:text-emerald-900 border border-emerald-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 id={titleId} className="text-base font-bold text-zinc-100">
              Xuất báo cáo & sơ đồ Action Canvas
            </h3>
            <p className="text-xs text-zinc-400">
              Định dạng chuẩn Markdown tương thích Notion, Obsidian và Google Docs.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <pre className="max-h-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono text-zinc-300 select-all">
            {markdown}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[0.6875rem] text-zinc-500 font-mono">
            {markdown.split('\n').length} dòng • {markdown.length} ký tự
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 theme-light:text-emerald-900" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Sao chép Markdown
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Tải file .md
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
