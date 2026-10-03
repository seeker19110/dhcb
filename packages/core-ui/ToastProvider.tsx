import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

// ── Hệ thống thông báo nổi (toast) dùng chung cho toàn app ───────────────────
// Thay cho việc mỗi trang tự render khối lỗi riêng. Gọi: const toast = useToast();
// rồi toast.error('...'), toast.success('...'), toast.info('...').

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: string
  kind: ToastKind
  message: string
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

// Cấu hình màu + icon theo loại toast
// Sắc độ -300 đọc tốt trên nền TỐI nhưng rớt AA hẳn trên nền SÁNG (đo được 1,38–1,52 so với
// sàn 4,5 ở Blue sky / Pink / Nhi đồng), nên các theme nền sáng đổi sang -800 (6,09–6,64) qua
// biến thể `theme-light:`. Không đổi chung một sắc độ cho cả hai được: -800 trên nền tối chỉ
// đạt ~2,0.
const STYLES: Record<ToastKind, { cls: string; Icon: typeof Info }> = {
  success: {
    cls: 'bg-accent-500/15 border-accent-500/30 text-accent-300 theme-light:text-accent-800',
    Icon: CheckCircle2,
  },
  error: {
    cls: 'bg-red-500/15 border-red-500/30 text-red-300 theme-light:text-red-800',
    Icon: AlertCircle,
  },
  info: {
    cls: 'bg-sky-500/15 border-sky-500/30 text-sky-300 theme-light:text-sky-800',
    Icon: Info,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = crypto.randomUUID()
    setToasts((list) => [...list, { id, kind, message }])
    // Hẹn giờ tự ẩn nằm trong từng <ToastItem> (dừng được khi rê chuột/focus) — xem toastDurationMs.
  }, [])

  const success = useCallback((m: string) => show(m, 'success'), [show])
  const error = useCallback((m: string) => show(m, 'error'), [show])
  const info = useCallback((m: string) => show(m, 'info'), [show])

  // PHẢI memo hoá: đây là GIÁ TRỊ CONTEXT, mà nhiều trang đặt `toast` vào mảng phụ thuộc của
  // useEffect (LiveLocation, Profile, WorkKanban, Life, LifeGraph, ActionCanvas…). Trước đây
  // `api` là object literal tạo mới MỖI LẦN render, nên cứ hiện một toast là ToastProvider
  // render lại → `api` đổi tham chiếu → các effect kia chạy lại. Với LiveLocation điều đó thành
  // vòng lặp vô hạn: lỗi GPS → toast → effect chạy lại → gọi lại watchPosition → lỗi GPS →
  // toast… (đo được 89 toast trong 3 giây khi trình duyệt từ chối quyền vị trí).
  const api = useMemo<ToastApi>(
    () => ({ show, success, error, info }),
    [show, success, error, info],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Khu vực hiển thị toast — nằm NGAY DƯỚI header (header cao h-14 = 3.5rem, xem
          Layout.tsx). Trước đây `top-0` nên toast phủ lên header và che nút Back suốt 4
          giây trên mobile (audit 2026-08-31 mục B2). `pt-safe` giữ nguyên cho trang KHÔNG
          có header — phần safe-area chỉ cộng thêm, không làm toast tụt quá xa. */}
      <div className="fixed top-14 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pt-3 pt-safe pointer-events-none">
        {/* Hai vùng thông báo LUÔN có mặt trong DOM (WCAG 4.1.3): trình đọc màn hình chỉ đọc nội
            dung được THÊM vào một vùng live đã tồn tại sẵn. Lỗi đi vùng `alert` (đọc ngay, ngắt
            lời), thành công/thông tin đi vùng `status` (đọc khi rảnh). Trước đây không có vùng
            live nào nên 117 lời gọi toast.error không bao giờ được đọc (audit 2026-09-30 C2). */}
        <div role="alert" className="flex w-full flex-col items-center gap-2">
          {toasts
            .filter((t) => t.kind === 'error')
            .map((t) => (
              <ToastItem key={t.id} toast={t} onClose={remove} />
            ))}
        </div>
        <div role="status" aria-live="polite" className="flex w-full flex-col items-center gap-2">
          {toasts
            .filter((t) => t.kind !== 'error')
            .map((t) => (
              <ToastItem key={t.id} toast={t} onClose={remove} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

/** Đọc chậm ~ 60 ms/ký tự. Thông tin/thành công tối thiểu 5 giây; lỗi tối thiểu 10 giây vì người
 * dùng cần thời gian hiểu và quyết định làm gì (WCAG 2.2.1 — audit 2026-09-30 C2, trước đây 4 giây
 * cho mọi loại). Hẹn giờ còn DỪNG khi rê chuột hoặc focus vào toast (xem ToastItem). */
const MS_PER_CHAR = 60
const MIN_MS: Record<ToastKind, number> = { success: 5000, info: 5000, error: 10000 }

// eslint-disable-next-line react-refresh/only-export-components
export function toastDurationMs(kind: ToastKind, message: string): number {
  return Math.max(MIN_MS[kind], message.length * MS_PER_CHAR)
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const { id, kind, message } = toast
  const { cls, Icon } = STYLES[kind]
  const [paused, setPaused] = useState(false)
  // Thời gian CÒN LẠI — giữ qua các lần dừng/chạy lại để rê chuột không làm toast sống mãi từ đầu.
  const remainingRef = useRef(toastDurationMs(kind, message))

  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const timer = setTimeout(() => onClose(id), remainingRef.current)
    return () => {
      clearTimeout(timer)
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt))
    }
  }, [paused, id, onClose])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto w-full max-w-sm flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md animate-fade-in ${cls}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span className="flex-1 leading-snug">{message}</span>
      {/* aria-label là BẮT BUỘC: nút chỉ có mỗi icon nên không có tên đọc được —
          thiếu nó là vi phạm WCAG "button-name" mức critical. */}
      <button
        onClick={() => onClose(id)}
        aria-label="Đóng thông báo"
        /* `tap-44` + flex căn giữa: icon chỉ 14px nên không ép kích thước tối thiểu
           thì vùng chạm ~14×14px, xa sàn 44px (CLAUDE.md mục 4.7). `-my-2` để nút to
           hơn không làm cao thêm cả hộp toast. */
        className="tap-44 -my-2 shrink-0 flex items-center justify-center opacity-60 hover:opacity-100 transition"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast phải dùng bên trong <ToastProvider>')
  return ctx
}
