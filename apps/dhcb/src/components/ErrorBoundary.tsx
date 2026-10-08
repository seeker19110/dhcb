// ErrorBoundary — bắt mọi lỗi render trong cây con và hiện màn hình thân thiện
// (kèm nút thử lại) thay vì để app trắng xoá. Đặc biệt quan trọng vì app lazy-load
// rất nhiều chunk: chỉ cần 1 chunk lỗi mạng là cả trang có thể sập nếu không bắt.
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { captureException } from '../lib/errorTracking'
import { buttonClass } from '@core/buttonStyles'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  // React gọi hàm này khi có lỗi ném ra trong lúc render con → bật cờ để hiện UI dự phòng.
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    // Ghi log ra console để debug.
    console.error('[ErrorBoundary] Lỗi render:', error)
    // Gửi lên Sentry nếu đã cấu hình VITE_SENTRY_DSN — no-op an toàn nếu chưa (xem errorTracking.ts).
    void captureException(error, { componentStack: errorInfo.componentStack })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">😵</div>
          <h1 className="text-lg font-semibold text-zinc-100">Đã có lỗi xảy ra</h1>
          <p className="text-sm text-zinc-400">
            Trang gặp sự cố khi tải. Hãy thử tải lại — thường là do mất mạng tạm thời hoặc app vừa
            được cập nhật.
          </p>
          <button onClick={this.handleReload} className={buttonClass()}>
            Tải lại trang
          </button>
        </div>
      </div>
    )
  }
}
