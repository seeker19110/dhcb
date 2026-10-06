// apps/dhcb/src/pages/domains/notes/NotesKanban.tsx — bảng Kanban việc cần làm, trang con của
// "Ghi chú" (`/ghi-chu/kanban`). Đổi tên hiển thị từ "Công việc" 2026-09-20; bố cục và API
// (`/api/work`) giữ NGUYÊN.
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, CheckCircle2, ArrowRight, ArrowLeft, Filter, Search } from 'lucide-react'
import { usePageTitle } from '../../../lib/usePageTitle'
import { duongDanGhiChu } from '../../../lib/domainRoutes'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import { useToast } from '@core/ToastProvider'
import {
  listWorkTasks,
  createWorkTask,
  updateWorkTaskStatus,
  listWorkProjects,
} from '../../../lib/workApi'
import type { WorkTask, WorkProject } from '@dhcb/core-contracts/work'

// Nền cố định trang này LUÔN tối (bg-zinc-950, không đổi theo theme — xem thẻ gốc bên
// dưới), nên `theme-light:` ở đây KHÔNG được chỉ đổi màu chữ sang sắc tối (chữ tối trên
// nền tối vẫn tối = rớt contrast ở theme sáng, bắt bởi e2e/a11y.spec.ts). Phải đổi CẢ nền
// sang màu sáng (`theme-light:bg-*-50`) cùng lúc, đúng pattern đã dùng ở Notes.tsx.
const PRIORITY_COLORS: Record<string, { label: string; cls: string }> = {
  urgent: {
    label: 'Khẩn cấp',
    cls: 'bg-red-500/15 theme-light:bg-red-50 text-red-400 theme-light:text-red-900 border-red-500/30',
  },
  high: {
    label: 'Cao',
    cls: 'bg-orange-500/15 theme-light:bg-orange-50 text-orange-400 theme-light:text-orange-900 border-orange-500/30',
  },
  medium: {
    label: 'Vừa',
    cls: 'bg-amber-500/15 theme-light:bg-amber-50 text-amber-400 theme-light:text-amber-900 border-amber-500/30',
  },
  low: {
    label: 'Thấp',
    cls: 'bg-blue-500/15 theme-light:bg-blue-50 text-blue-400 theme-light:text-blue-800 border-blue-500/30',
  },
}

export default function NotesKanban() {
  usePageTitle('Bảng Kanban ghi chú | Đồng hành cùng bạn')
  const nav = useNavigate()
  const toast = useToast()
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [projects, setProjects] = useState<WorkProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Quick add state
  const [quickTitle, setQuickTitle] = useState('')
  const [addingToStatus, setAddingToStatus] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tData, pData] = await Promise.all([
        listWorkTasks(selectedProjectId === 'all' ? undefined : selectedProjectId).catch(() => []),
        listWorkProjects().catch(() => []),
      ])
      setTasks(tData)
      setProjects(pData)
    } catch {
      toast.error('Không thể tải danh sách công việc')
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId, toast])

  useEffect(() => {
    // Gọi qua then() để mọi setState chạy trong callback bất đồng bộ
    // (luật react-hooks/set-state-in-effect — không setState đồng bộ trong effect).
    void Promise.resolve().then(loadData)
  }, [loadData])

  const handleStatusChange = async (task: WorkTask, newStatus: 'todo' | 'done') => {
    try {
      await updateWorkTaskStatus(task.id, newStatus)
      toast.success(newStatus === 'done' ? 'Đã hoàn thành công việc 🎉' : 'Đã chuyển trạng thái')
      loadData()
    } catch {
      toast.error('Không thể cập nhật trạng thái')
    }
  }

  const handleQuickAdd = async () => {
    if (!quickTitle.trim()) return
    try {
      await createWorkTask({
        title: quickTitle.trim(),
        priority: 'medium',
        projectId: selectedProjectId === 'all' ? undefined : selectedProjectId,
      })
      setQuickTitle('')
      setAddingToStatus(null)
      toast.success('Đã thêm việc mới')
      loadData()
    } catch {
      toast.error('Không thể thêm việc')
    }
  }

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo')
  const doneTasks = filteredTasks.filter((t) => t.status === 'done')

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout onBack={() => nav(duongDanGhiChu())} title="Bảng Kanban việc cần làm" />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Lưới 2 cột, không phải bảng cuộn ngang →
      width="standard". */}
      <PageShell width="standard" baseWidth="max-w-6xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Bảng Kanban việc cần làm
        </h1>

        {/* Thanh công cụ lọc & tìm kiếm */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="tap-44-y bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              aria-label="Lọc theo dự án"
              className="tap-44-y bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">Tất cả dự án ({tasks.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Bảng Kanban 2 cột lớn: Cần làm & Hoàn thành */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Đang tải bảng công việc…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cột 1: Cần làm (Todo) */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                  <h3 className="text-sm font-bold text-white">CẦN THỰC HIỆN</h3>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                    {todoTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingToStatus(addingToStatus === 'todo' ? null : 'todo')}
                  className="tap-44 text-xs text-accent-400 theme-light:text-accent-800 hover:text-accent-300 theme-light:hover:text-accent-900 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm việc
                </button>
              </div>

              {/* Form thêm nhanh */}
              {addingToStatus === 'todo' && (
                <div className="bg-zinc-950 p-3 rounded-xl border border-accent-500/40 space-y-2 animate-fade-in">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Nhập tiêu đề công việc..."
                    // Ô nhập này chỉ xuất hiện SAU một hành động của người dùng (mở form / bấm "thêm"),
                    // nên đưa tiêu điểm vào đó là chuyển tiêu điểm đúng chỗ theo WAI-ARIA, không phải
                    // cướp tiêu điểm lúc tải trang (audit 2026-09-05, F1).
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAddingToStatus(null)}
                      className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleQuickAdd}
                      className="px-3 py-1 bg-accent-500 text-[#09090b] font-semibold rounded-lg text-xs"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách task trong cột */}
              <div className="space-y-2.5 flex-1 min-h-[150px]">
                {todoTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-content-muted">
                    Không có việc cần làm
                  </div>
                ) : (
                  todoTasks.map((task) => {
                    const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium!
                    return (
                      <div
                        key={task.id}
                        className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3.5 space-y-2 shadow-sm group transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white leading-relaxed">
                            {task.title}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${priority.cls}`}
                          >
                            {priority.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
                          <span className="text-[11px] text-zinc-500">
                            {task.dueAt ? `Hạn: ${task.dueAt}` : 'Chưa có hạn'}
                          </span>
                          <button
                            onClick={() => handleStatusChange(task, 'done')}
                            className="tap-44 text-xs text-emerald-400 theme-light:text-emerald-900 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
                          >
                            <span>Xong</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Cột 2: Đã hoàn thành (Done) */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900" />
                  <h3 className="text-sm font-bold text-white">ĐÃ HOÀN THÀNH</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 theme-light:bg-emerald-50 text-xs font-bold text-emerald-300 theme-light:text-emerald-900">
                    {doneTasks.length}
                  </span>
                </div>
              </div>

              {/* Danh sách task hoàn thành */}
              <div className="space-y-2.5 flex-1 min-h-[150px]">
                {doneTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-content-muted">
                    Chưa có việc nào hoàn thành
                  </div>
                ) : (
                  doneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3.5 space-y-2 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-300 line-through leading-relaxed">
                          {task.title}
                        </p>
                        <span className="text-xs text-emerald-400 theme-light:text-emerald-900 shrink-0">
                          ✓ Đã xong
                        </span>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleStatusChange(task, 'todo')}
                          className="tap-44 text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Làm lại</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  )
}
