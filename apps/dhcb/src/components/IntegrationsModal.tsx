// apps/dhcb/src/components/IntegrationsModal.tsx — Modal đồng bộ Google Calendar & Notion.
import { thongDiepLoiThanThien } from '../lib/friendlyError'
import { useState } from 'react'
import { Calendar, FileText, ExternalLink, Check, AlertCircle, X } from 'lucide-react'
import { executeIntegrationSync } from '../lib/integrationsApi'
import { useDialogBehavior } from './useDialogBehavior'
import { buttonClass } from '@core/buttonStyles'

interface IntegrationsModalProps {
  isOpen: boolean
  onClose: () => void
  itemType: 'study_schedule' | 'work_task'
  itemData: {
    title: string
    description?: string
    startIso?: string
    endIso?: string
    tags?: string[]
    dueDate?: string
  }
}

export default function IntegrationsModal({ isOpen, onClose, itemData }: IntegrationsModalProps) {
  const [syncing, setSyncing] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
    url?: string
  } | null>(null)

  // 6 hành vi a11y bắt buộc của hộp thoại (Escape, bẫy tiêu điểm, khoá cuộn nền…).
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose, isOpen)

  if (!isOpen) return null

  const handleSyncGoogleCalendar = async () => {
    setSyncing('google_calendar')
    setStatusMessage(null)
    try {
      const now = new Date()
      const startIso = itemData.startIso || now.toISOString()
      const endIso = itemData.endIso || new Date(now.getTime() + 60 * 60 * 1000).toISOString()

      const res = await executeIntegrationSync({
        kind: 'google_calendar_sync',
        event: {
          title: itemData.title,
          description: itemData.description,
          startIso,
          endIso,
        },
      })

      setStatusMessage({
        type: 'success',
        text: res.message,
        url: res.externalUrl,
      })

      if (res.externalUrl) {
        window.open(res.externalUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err: unknown) {
      const msg = thongDiepLoiThanThien(err, 'Không thể đồng bộ Google Calendar')
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncNotion = async () => {
    setSyncing('notion')
    setStatusMessage(null)
    try {
      const res = await executeIntegrationSync({
        kind: 'notion_export',
        task: {
          title: itemData.title,
          status: 'todo',
          priority: 'medium',
          contentMarkdown: itemData.description,
          tags: itemData.tags || ['donghanh_ai'],
          dueDate: itemData.dueDate,
        },
      })

      setStatusMessage({
        type: 'success',
        text: res.message,
        url: res.externalUrl,
      })
    } catch (err: unknown) {
      const msg = thongDiepLoiThanThien(err, 'Không thể xuất sang Notion')
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[90dvh] overflow-y-auto focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="tap-44 absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id={titleId} className="text-lg font-semibold text-zinc-100 mb-1 pr-10">
          Tích hợp Ứng dụng Ngoài
        </h3>
        <p className="text-xs text-zinc-400 mb-5">
          Đồng bộ nhanh "{itemData.title}" sang các công cụ quản lý cá nhân yêu thích.
        </p>

        <div className="space-y-3 mb-5">
          {/* Google Calendar */}
          <button
            onClick={handleSyncGoogleCalendar}
            disabled={syncing !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-blue-500/50 transition group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 theme-light:text-blue-800">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-200 group-hover:text-blue-400 transition-colors">
                  Google Calendar
                </h4>
                <p className="text-xs text-zinc-400">Tạo sự kiện & nhắc hẹn trên lịch</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
          </button>

          {/* Notion */}
          <button
            onClick={handleSyncNotion}
            disabled={syncing !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-purple-500/50 transition group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 theme-light:text-purple-800">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-200 group-hover:text-purple-400 transition-colors">
                  Notion Workspace
                </h4>
                <p className="text-xs text-zinc-400">Xuất trang nhiệm vụ & ghi chú</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 mb-4 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 theme-light:text-emerald-900'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300 theme-light:text-rose-900'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 theme-light:text-rose-900 shrink-0 mt-0.5" />
            )}
            <div>
              <p>{statusMessage.text}</p>
              {statusMessage.url && (
                <a
                  href={statusMessage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline mt-1 inline-flex items-center gap-1 font-medium hover:text-white"
                >
                  Mở liên kết ngay <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
