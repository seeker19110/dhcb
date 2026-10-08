import { useState, useEffect, useCallback } from 'react'
import {
  ThumbsDown,
  MessageSquare,
  Mic,
  RefreshCw,
  AlertCircle,
  MessageSquareHeart,
  Star,
} from 'lucide-react'
import { getAuthHeader } from '@core/authHeader'
import { useToast } from '@core/ToastProvider'
import { thongDiepLoiQuanTri } from '../../lib/friendlyError'
import type { TutorFeedbackRow } from '@dhcb/core-contracts/adminViews'
import {
  CATEGORY_METADATA,
  type UserFeedbackRecord,
  type UserFeedbackStatus,
} from '@dhcb/core-contracts/feedback'
import { buttonVariantClass } from '@core/buttonStyles'

export default function AdminFeedbackPanel() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'user' | 'tutor'>('user')

  // User feedback states
  const [userFeedbacks, setUserFeedbacks] = useState<UserFeedbackRecord[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Tutor feedback states
  const [tutorFeedbacks, setTutorFeedbacks] = useState<TutorFeedbackRow[]>([])
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedback = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('type', activeTab)

      if (activeTab === 'user') {
        if (categoryFilter !== 'all') params.set('category', categoryFilter)
        if (statusFilter !== 'all') params.set('status', statusFilter)
      } else {
        if (sourceFilter !== 'all') params.set('source', sourceFilter)
      }

      const headers = await getAuthHeader()
      // Bật spinner SAU await đầu tiên — setState đồng bộ trong effect bị cấm (react-hooks 7);
      // lúc mount loading đã là true sẵn nên không đổi hành vi.
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin-feedback?${params.toString()}`, { headers })
      if (res.status === 401 || res.status === 403) {
        setError('Chỉ admin mới truy cập được')
        return
      }
      if (!res.ok) throw new Error('Không thể tải danh sách phản hồi')
      const data = await res.json()
      if (activeTab === 'user') {
        setUserFeedbacks(data.feedbackList || [])
      } else {
        setTutorFeedbacks(data.feedbackList || [])
      }
    } catch (err: unknown) {
      setError(thongDiepLoiQuanTri(err, 'Lỗi tải dữ liệu'))
    } finally {
      setLoading(false)
    }
  }, [activeTab, categoryFilter, statusFilter, sourceFilter])

  useEffect(() => {
    // Hoãn sang microtask để KHÔNG setState đồng bộ trong thân effect (luật react-hooks 7).
    void Promise.resolve().then(fetchFeedback)
  }, [fetchFeedback])

  async function handleStatusChange(id: string, newStatus: UserFeedbackStatus) {
    setUpdatingId(id)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/admin-feedback', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Cập nhật trạng thái thất bại')
      setUserFeedbacks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
      )
      toast.success('Đã cập nhật trạng thái')
    } catch (err) {
      toast.error(thongDiepLoiQuanTri(err))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'user'
              ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'
          }`}
        >
          <MessageSquareHeart className="w-4 h-4" />Ý Kiến Người Dùng & Báo Lỗi (
          {userFeedbacks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tutor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'tutor'
              ? 'bg-amber-500/20 text-amber-300 theme-light:text-amber-900 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          Đánh Giá Gia Sư AI 👎 ({tutorFeedbacks.length})
        </button>
      </div>

      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            {activeTab === 'user' ? (
              <MessageSquareHeart className="w-5 h-5 text-accent-400" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-amber-400 theme-light:text-amber-900" />
            )}
            <div>
              <h3 className="font-bold text-white text-base">
                {activeTab === 'user'
                  ? 'Ý kiến đóng góp & đề xuất tính năng'
                  : 'Phản hồi 👎 chất lượng gia sư AI'}
              </h3>
              <p className="text-xs text-zinc-400">
                {activeTab === 'user'
                  ? 'Lắng nghe phản hồi từ học viên để ưu tiên phát triển và cải thiện sản phẩm.'
                  : 'Bổ sung các ca AI trả lời chưa chuẩn vào bộ đánh giá (Golden set).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'user' ? (
              <>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Lọc theo danh mục"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="all">Tất cả danh mục</option>
                  <option value="feature">💡 Đề xuất tính năng</option>
                  <option value="bug">🐛 Báo lỗi</option>
                  <option value="content">📚 Góp ý nội dung</option>
                  <option value="ui_ux">🎨 Giao diện & Trải nghiệm</option>
                  <option value="other">💬 Ý kiến khác</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Lọc theo trạng thái"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="new">Mới nhận</option>
                  <option value="reviewed">Đã xem</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </>
            ) : (
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Lọc theo nguồn"
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">Tất cả nguồn</option>
                <option value="chat">Chat AI</option>
                <option value="speaking">Luyện nói (Speaking)</option>
              </select>
            )}

            <button
              type="button"
              onClick={fetchFeedback}
              aria-label="Tải lại danh sách phản hồi"
              className={`${buttonVariantClass('outline')} tap-44 inline-flex items-center justify-center p-1.5 rounded-lg`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 theme-light:text-rose-900 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-xs text-zinc-500 py-8 text-center">
              Đang tải danh sách phản hồi...
            </div>
          ) : activeTab === 'user' ? (
            userFeedbacks.length === 0 ? (
              <div className="text-xs text-zinc-500 py-8 text-center">
                Chưa có ý kiến đóng góp nào
              </div>
            ) : (
              userFeedbacks.map((fb) => {
                const meta = CATEGORY_METADATA[fb.category] || CATEGORY_METADATA.other
                return (
                  <div
                    key={fb.id}
                    className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-lg text-[0.6875rem] border ${meta.color}`}
                        >
                          <span>{meta.icon}</span> {meta.labelVi}
                        </span>

                        {fb.rating && (
                          <span className="flex items-center gap-0.5 text-amber-400 theme-light:text-amber-900 font-bold text-[0.6875rem] bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            <Star className="w-3 h-3 fill-amber-400" /> {fb.rating}/5
                          </span>
                        )}

                        <span className="text-white font-medium">
                          {fb.userEmail || fb.userId || 'Khách'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={fb.status}
                          disabled={updatingId === fb.id}
                          onChange={(e) =>
                            handleStatusChange(fb.id, e.target.value as UserFeedbackStatus)
                          }
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[0.6875rem] text-zinc-300 focus:outline-none focus:border-accent-500"
                        >
                          <option value="new">Mới nhận</option>
                          <option value="reviewed">Đã xem</option>
                          <option value="in_progress">Đang xử lý</option>
                          <option value="resolved">Đã giải quyết</option>
                          <option value="closed">Đã đóng</option>
                        </select>

                        <span className="text-zinc-500 text-[0.6875rem]">
                          {new Date(fb.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {fb.title && <p className="font-bold text-white text-sm">{fb.title}</p>}

                    <p className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60">
                      {fb.message}
                    </p>

                    {fb.contextInfo && Object.keys(fb.contextInfo).length > 0 && (
                      <div className="text-[0.6875rem] text-zinc-500 flex flex-wrap gap-2 pt-1">
                        {(fb.contextInfo as { route?: string }).route && (
                          <span className="bg-zinc-800/60 px-2 py-0.5 rounded">
                            Route: {(fb.contextInfo as { route?: string }).route}
                          </span>
                        )}
                        {(fb.contextInfo as { appVersion?: string }).appVersion && (
                          <span className="bg-zinc-800/60 px-2 py-0.5 rounded">
                            v{(fb.contextInfo as { appVersion?: string }).appVersion}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )
          ) : tutorFeedbacks.length === 0 ? (
            <div className="text-xs text-zinc-500 py-8 text-center">Chưa có phản hồi 👎 nào</div>
          ) : (
            tutorFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {fb.source === 'chat' ? (
                      <span className="inline-flex items-center gap-1 text-indigo-400 theme-light:text-indigo-800 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded text-[0.6875rem]">
                        <MessageSquare className="w-3 h-3" /> Chat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 theme-light:text-emerald-900 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded text-[0.6875rem]">
                        <Mic className="w-3 h-3" /> Speaking
                      </span>
                    )}
                    <span className="text-white font-medium">{fb.userEmail || fb.userId}</span>
                  </div>

                  <span className="text-zinc-500 text-[0.6875rem]">
                    {new Date(fb.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800/50">
                    <span className="text-zinc-500 font-semibold block text-[0.6875rem]">
                      Người dùng nhập:
                    </span>
                    <span className="text-zinc-200">{fb.userInput}</span>
                  </div>
                  <div className="p-2 bg-rose-500/5 rounded border border-rose-500/20">
                    <span className="text-rose-400 theme-light:text-rose-900 font-semibold block text-[0.6875rem]">
                      AI phản hồi (bị chê):
                    </span>
                    <span className="text-rose-200 theme-light:text-rose-900">{fb.aiFeedback}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
