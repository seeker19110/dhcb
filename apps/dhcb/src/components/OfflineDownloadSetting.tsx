// apps/dhcb/src/components/OfflineDownloadSetting.tsx — Công tắc "Tải để học ngoại tuyến" ở Cài
// đặt (audit 2026-09-30 M14, quyết định chủ dự án 2026-10-05: mặc định BẬT). Cho người dùng biết
// dung lượng ước lượng, phần đã tải trên máy này và vì sao chưa tải (nếu chưa).
import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import {
  formatMegabytes,
  isOfflineDownloadEnabled,
  precacheBlockReason,
  readPrecacheConditions,
  setOfflineDownloadEnabled,
  type PrecacheBlockReason,
} from '../lib/offlineDownload'
import type { DataPackSummary, PrecacheProgress } from '../lib/dataPrecache'

const SWITCH_ID = 'offline-download-toggle'

// Câu giải thích trạng thái — một chỗ cho cả hai ngôn ngữ giao diện.
const STATUS_TEXT: Record<PrecacheBlockReason | 'ready', { vi: string; en: string }> = {
  ready: {
    vi: 'Đang tải dần lúc máy rảnh; đã tải xong thì chỉ tải lại phần có thay đổi.',
    en: 'Downloading gradually while idle; once done, only changed files are fetched again.',
  },
  disabled: {
    vi: 'Đang tắt. Phần đã tải trước đó vẫn dùng được khi mất mạng.',
    en: 'Off. Anything already downloaded still works offline.',
  },
  'save-data': {
    vi: 'Tạm dừng vì máy đang bật chế độ tiết kiệm dữ liệu.',
    en: 'Paused because your device has Data Saver on.',
  },
  guest: {
    vi: 'Sẽ bắt đầu sau khi bạn đăng nhập và học phiên đầu tiên.',
    en: 'Starts after you sign in and finish your first study session.',
  },
  'not-studied': {
    vi: 'Sẽ bắt đầu sau khi bạn học phiên đầu tiên.',
    en: 'Starts after you finish your first study session.',
  },
  unsupported: {
    vi: 'Trình duyệt này không hỗ trợ lưu dữ liệu để học ngoại tuyến.',
    en: 'This browser cannot store data for offline study.',
  },
}

type SummaryState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; summary: DataPackSummary }

// `isVi` = ngôn ngữ GIAO DIỆN là tiếng Việt (tách khỏi chiều học từ đợt minor 13).
export default function OfflineDownloadSetting({ isVi }: { isVi: boolean }) {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState<boolean>(isOfflineDownloadEnabled)
  const [summary, setSummary] = useState<SummaryState>({ status: 'loading' })
  const lang = isVi ? 'vi' : 'en'

  // Đọc tổng dung lượng từ manifest (vài chục KB) — chỉ khi mở trang Cài đặt.
  useEffect(() => {
    let alive = true
    import('../lib/dataPrecache')
      .then((m) => m.fetchDataPackSummary())
      .then((s) => alive && setSummary({ status: 'ready', summary: s }))
      .catch(() => alive && setSummary({ status: 'error' }))
    return () => {
      alive = false
    }
  }, [])

  // Cập nhật "đã tải X MB" theo tiến độ thật khi đang tải.
  useEffect(() => {
    const onProgress = (e: Event) => {
      const p = (e as CustomEvent<PrecacheProgress>).detail
      setSummary((prev) =>
        prev.status === 'ready'
          ? { status: 'ready', summary: { ...prev.summary, cachedBytes: p.bytesDone } }
          : prev,
      )
    }
    // Trùng chuỗi với PRECACHE_PROGRESS_EVENT (lib/dataPrecache.ts) — không import tĩnh để module
    // tải chỉ nạp khi cần.
    window.addEventListener('data-precache-progress', onProgress)
    return () => window.removeEventListener('data-precache-progress', onProgress)
  }, [])

  const reason = precacheBlockReason({
    ...readPrecacheConditions(user ? { id: user.id, isGuest: user.isGuest } : null),
    enabled,
  })
  const status = STATUS_TEXT[reason ?? 'ready'][lang]

  function toggle() {
    const next = !enabled
    setOfflineDownloadEnabled(next)
    setEnabled(next)
  }

  let sizeText: string
  if (summary.status === 'loading') {
    sizeText = isVi ? 'Đang tính dung lượng…' : 'Calculating size…'
  } else if (summary.status === 'error') {
    sizeText = isVi
      ? 'Chưa đọc được dung lượng — cần kết nối mạng, mở lại trang sau.'
      : 'Could not read the size — needs a connection, try again later.'
  } else {
    const total = formatMegabytes(summary.summary.totalBytes, lang)
    const done = formatMegabytes(summary.summary.cachedBytes, lang)
    sizeText = isVi
      ? `Dung lượng ước lượng: ${total} trên máy · đã tải ${done}.`
      : `Estimated size: ${total} on this device · ${done} downloaded.`
  }

  return (
    <section className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-accent-400 shrink-0" aria-hidden="true" />
            <label htmlFor={SWITCH_ID} className="text-sm font-semibold text-white">
              {isVi ? 'Tải để học ngoại tuyến' : 'Download for offline study'}
            </label>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {isVi
              ? 'Tải dần từ điển, bài học, mẫu câu và truyện môn Tiếng Anh về máy để mở lại khi mất mạng. Chỉ dùng trên máy này.'
              : 'Gradually saves the English dictionary, lessons, phrases and stories to this device so they open without a connection.'}
          </p>
        </div>
        <button
          id={SWITCH_ID}
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-describedby={`${SWITCH_ID}-status`}
          onClick={toggle}
          // Cùng khuôn công tắc của VoicePicker sau đợt U9a: nút trong suốt 44×44 (vùng chạm), viên
          // thuốc 44×24 vẽ bên trong.
          className="tap-44 flex items-center justify-center rounded-full shrink-0"
        >
          <span
            aria-hidden="true"
            className={`relative w-11 h-6 rounded-full transition ${
              enabled ? 'bg-accent-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-5' : ''
              }`}
            />
          </span>
        </button>
      </div>
      <div id={`${SWITCH_ID}-status`} className="mt-3 space-y-1">
        <p className="text-xs text-zinc-300">{sizeText}</p>
        <p className="text-xs text-zinc-400">{status}</p>
      </div>
    </section>
  )
}
