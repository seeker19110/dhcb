// apps/dhcb/src/pages/domains/notes/Notes.tsx — trang "Ghi chú" (trước đây là "Không Gian Công
// Việc", V2-15).
//
// [2026-09-20] Trang này TỪNG là tab `?muc=cong-viec` của trang gộp "Công việc & Đời sống"
// (`worklife/WorkLife.tsx`). Trang gộp và nửa "Đời sống" đã bị gỡ hẳn, nên đây là trang CẤP 1
// độc lập tại `/ghi-chu` — không còn chế độ `embedded`, không còn tab nào để chọn.
// Bố cục, kiểu dữ liệu và API (`/api/work`) giữ NGUYÊN, chỉ đổi tên hiển thị.
import { thongDiepLoiThanThien } from '../../../lib/friendlyError'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { duongDanGhiChuKanban } from '../../../lib/domainRoutes'
import {
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
} from 'lucide-react'
import Modal from '../../../components/Modal'
import Field from '../../../components/Field'
import LoadError from '../../../components/LoadError'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import { useToast } from '@core/ToastProvider'
import {
  listWorkProjects,
  createWorkProject,
  updateWorkProjectStatus,
  listWorkTasks,
  createWorkTask,
  updateWorkTaskStatus,
  listWorkMeetings,
  recordWorkMeeting,
  listWorkDocuments,
  createWorkDocument,
} from '../../../lib/workApi'
import {
  NOTE_CONTENT_MAX_LENGTH,
  type WorkProject,
  type WorkTask,
  type WorkMeeting,
  type WorkDocument,
} from '@dhcb/core-contracts/work'
import { usePageTitle } from '../../../lib/usePageTitle'

// Tab đang chọn: màu ACCENT như mọi điều hướng khác của app (thanh bên, thanh đáy). Trước 0500
// trang này dùng riêng `blue-600` — lệch màu thương hiệu ở theme không phải xanh (audit M17).
const TAB_DANG_CHON =
  'bg-accent-500/15 text-accent-300 theme-light:text-accent-800 border border-accent-500/30'

// Ngưỡng cảnh báo đếm ký tự: chỉ hiện khi người dùng đã dùng quá 80% hạn mức. Hiện sớm hơn
// thì con số chỉ làm nhiễu ô nhập (luật "chống nhiễu giao diện" — UiNoise.design.test.ts).
const NOTE_COUNTER_THRESHOLD = Math.floor(NOTE_CONTENT_MAX_LENGTH * 0.8)

export default function Notes() {
  usePageTitle('Ghi chú')
  const nav = useNavigate()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'meetings' | 'documents'>(
    'tasks',
  )
  const [projects, setProjects] = useState<WorkProject[]>([])
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [meetings, setMeetings] = useState<WorkMeeting[]>([])
  const [documents, setDocuments] = useState<WorkDocument[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  // Lỗi TẢI dữ liệu — tách khỏi trạng thái rỗng, xem components/LoadError.tsx.
  const [loadError, setLoadError] = useState<string | null>(null)
  // Chặn gửi trùng: mạng chậm mà bấm "Lưu" hai lần sẽ tạo ra hai bản ghi.
  const [submitting, setSubmitting] = useState(false)

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)

  // Forms
  const [projectForm, setProjectForm] = useState({ name: '', description: '', deadline: '' })
  const [taskForm, setTaskForm] = useState({
    title: '',
    projectId: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueAt: '',
  })
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    scheduledAt: '',
    durationMinutes: 30,
    summary: '',
    actionItems: '',
  })
  const [docForm, setDocForm] = useState({
    title: '',
    projectId: '',
    documentType: 'spec' as 'spec' | 'minutes' | 'proposal' | 'report' | 'note',
    summary: '',
    contentUri: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [projData, taskData, meetData, docData] = await Promise.all([
        listWorkProjects(),
        listWorkTasks(selectedProjectId || undefined),
        listWorkMeetings(),
        listWorkDocuments(selectedProjectId || undefined),
      ])
      setProjects(projData)
      setTasks(taskData)
      setMeetings(meetData)
      setDocuments(docData)
      setLoadError(null)
    } catch (err: unknown) {
      setLoadError(thongDiepLoiThanThien(err, 'Không thể tải dữ liệu không gian làm việc'))
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    // Gọi qua then() để mọi setState chạy trong callback bất đồng bộ
    // (luật react-hooks/set-state-in-effect — không setState đồng bộ trong effect).
    void Promise.resolve().then(loadData)
  }, [loadData])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const created = await createWorkProject({
        name: projectForm.name,
        description: projectForm.description || undefined,
        deadline: projectForm.deadline ? new Date(projectForm.deadline).toISOString() : undefined,
      })
      setProjects((prev) => [created, ...prev])
      setShowProjectModal(false)
      setProjectForm({ name: '', description: '', deadline: '' })
      toast.success('Đã tạo dự án thành công!')
    } catch (err: unknown) {
      toast.error(thongDiepLoiThanThien(err, 'Lỗi khi tạo dự án'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const created = await createWorkTask({
        title: taskForm.title,
        projectId: taskForm.projectId || undefined,
        priority: taskForm.priority,
        dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : undefined,
      })
      setTasks((prev) => [created, ...prev])
      setShowTaskModal(false)
      setTaskForm({ title: '', projectId: '', priority: 'medium', dueAt: '' })
      toast.success('Đã tạo công việc!')
    } catch (err: unknown) {
      toast.error(thongDiepLoiThanThien(err, 'Lỗi khi tạo công việc'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleTaskStatus = async (task: WorkTask) => {
    const nextStatus: WorkTask['status'] = task.status === 'done' ? 'todo' : 'done'
    try {
      const updated = await updateWorkTaskStatus(task.id, nextStatus)
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      toast.success(nextStatus === 'done' ? 'Đã hoàn thành công việc!' : 'Đã mở lại công việc')
    } catch (err: unknown) {
      toast.error(thongDiepLoiThanThien(err, 'Lỗi khi cập nhật trạng thái'))
    }
  }

  const handleRecordMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const actionItems = meetingForm.actionItems
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const created = await recordWorkMeeting({
        title: meetingForm.title,
        scheduledAt: new Date(meetingForm.scheduledAt).toISOString(),
        durationMinutes: Number(meetingForm.durationMinutes) || 30,
        summary: meetingForm.summary || undefined,
        actionItems: actionItems.length > 0 ? actionItems : undefined,
      })
      setMeetings((prev) => [created, ...prev])
      setShowMeetingModal(false)
      setMeetingForm({
        title: '',
        scheduledAt: '',
        durationMinutes: 30,
        summary: '',
        actionItems: '',
      })
      toast.success('Đã ghi nhận biên bản cuộc họp!')
    } catch (err: unknown) {
      toast.error(thongDiepLoiThanThien(err, 'Lỗi khi lưu cuộc họp'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const created = await createWorkDocument({
        title: docForm.title,
        projectId: docForm.projectId || undefined,
        documentType: docForm.documentType,
        summary: docForm.summary,
        contentUri: docForm.contentUri || undefined,
      })
      setDocuments((prev) => [created, ...prev])
      setShowDocModal(false)
      setDocForm({ title: '', projectId: '', documentType: 'spec', summary: '', contentUri: '' })
      toast.success('Đã thêm tài liệu!')
    } catch (err: unknown) {
      toast.error(thongDiepLoiThanThien(err, 'Lỗi khi tạo tài liệu'))
    } finally {
      setSubmitting(false)
    }
  }

  // [2026-09-02, đợt 4 thiết kế lại desktop] width="standard"; giữ bố cục flex cột.
  const body = (
    <PageShell
      width="standard"
      baseWidth="max-w-6xl"
      // `!pb-[calc(5rem+var(--bnav-h))]`: `!important` ghi đè lề của `PageShell`, nên phải tự
      // cộng lại `--bnav-h`. Trước 2026-09-15 ở đây là `!pb-20` (80px) < thanh nav 97px — lỗi
      // TIỀM ẨN, chưa lộ khi dữ liệu còn ngắn. Cổng canh: e2e/mobile-layout-guards.spec.ts
      className="!pt-6 !pb-[calc(5rem+var(--bnav-h))] flex flex-1 flex-col space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Ghi chú
        </h1>
        {/* `flex-wrap`: ba điều khiển dùng nút chuẩn (`buttonClass`, chữ không xuống dòng) rộng
            hơn bản tự ghép cũ — ở 320–390px chúng tràn ngang nếu ép một hàng (changelog 0500,
            cổng e2e/mobile-layout-guards.spec.ts). */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => nav(duongDanGhiChuKanban())}
            // [0500, audit M17] Lối sang trang khác → nút VIỀN, không phải nút chính: nút chính
            // của trang là "Thêm …" trong từng tab (accent). Trước đây nền blue-500 lệch accent.
            className={buttonClass({ variant: 'outline' })}
            title="Bảng Kanban tương tác"
          >
            <FolderKanban className="w-4 h-4" />
            Bảng Kanban
          </button>
          <select
            // Ô lọc không có nhãn hiển thị (chỉ có option "Tất cả dự án") → cần
            // aria-label để trình đọc màn hình biết ô này lọc theo cái gì.
            aria-label="Lọc theo dự án"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="tap-44-y px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none"
          >
            <option value="">Tất cả dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className={buttonClass({ variant: 'outline' })}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'tasks' ? TAB_DANG_CHON : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Công việc{loading || loadError ? '' : ` (${tasks.length})`}
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'projects' ? TAB_DANG_CHON : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Dự án{loading || loadError ? '' : ` (${projects.length})`}
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'meetings' ? TAB_DANG_CHON : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Cuộc họp{loading || loadError ? '' : ` (${meetings.length})`}
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'documents' ? TAB_DANG_CHON : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Ghi chú{loading || loadError ? '' : ` (${documents.length})`}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent-400 theme-light:text-accent-800 animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Đang tải dữ liệu công việc...</p>
        </div>
      ) : loadError ? (
        // Lỗi TẢI phải được ưu tiên hơn trạng thái rỗng: nếu không, mất mạng lại
        // hiện ra đúng màn "chưa có gì" và người dùng tưởng mất dữ liệu.
        <div className="mt-6">
          <LoadError message={loadError} onRetry={() => void loadData()} retrying={loading} />
        </div>
      ) : (
        <div>
          {/* Tab 1: Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-200">Danh sách công việc</h3>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className={buttonClass({ variant: 'primary' })}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm công việc
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                  Chưa có công việc nào trong danh sách.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tasks.map((task) => {
                    const isDone = task.status === 'done'
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                          isDone
                            ? 'bg-zinc-950/60 border-zinc-800/60 opacity-60'
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className="tap-44 mt-0.5 text-zinc-400 hover:text-emerald-400 transition"
                          >
                            {isDone ? (
                              <CheckCircle className="w-5 h-5 text-emerald-400 theme-light:text-emerald-800" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-500" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-sm font-semibold truncate ${
                                isDone ? 'line-through text-zinc-500' : 'text-zinc-200'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                              <span
                                className={`text-[0.6875rem] px-2 py-0.5 rounded font-medium uppercase ${
                                  task.priority === 'urgent'
                                    ? 'bg-red-950/80 theme-light:bg-red-50 text-red-400 theme-light:text-red-800 border border-red-800/40'
                                    : task.priority === 'high'
                                      ? 'bg-amber-950/80 theme-light:bg-amber-50 text-amber-400 theme-light:text-amber-800 border border-amber-800/40'
                                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                                }`}
                              >
                                {task.priority}
                              </span>
                              {task.dueAt && (
                                <span className="flex items-center gap-1 text-zinc-400">
                                  <Clock className="w-3 h-3" />
                                  {new Date(task.dueAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-200">Dự án đang thực hiện</h3>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className={buttonClass({ variant: 'primary' })}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo dự án mới
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                  Chưa có dự án nào. Nhấn &quot;Tạo dự án mới&quot; để bắt đầu!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-zinc-100 text-base">{proj.name}</h4>
                        <span
                          className={`text-[0.6875rem] px-2 py-0.5 rounded font-medium uppercase border ${
                            proj.status === 'completed'
                              ? 'bg-emerald-950/80 theme-light:bg-emerald-50 text-emerald-400 theme-light:text-emerald-800 border-emerald-800/40'
                              : 'bg-blue-950/80 theme-light:bg-blue-50 text-blue-400 theme-light:text-blue-800 border-blue-800/40'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </div>
                      {proj.description && (
                        <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                          {proj.description}
                        </p>
                      )}
                      {proj.deadline && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400/90 theme-light:text-amber-800/90 mt-4">
                          <Calendar className="w-3.5 h-3.5" />
                          Hạn chót: {new Date(proj.deadline).toLocaleDateString()}
                        </div>
                      )}
                      <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end gap-2">
                        <button
                          onClick={() =>
                            updateWorkProjectStatus(
                              proj.id,
                              proj.status === 'completed' ? 'active' : 'completed',
                            ).then(loadData)
                          }
                          className="tap-44 text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
                        >
                          {proj.status === 'completed' ? 'Mở lại dự án' : 'Đánh dấu hoàn thành'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Meetings */}
          {activeTab === 'meetings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-200">
                  Biên Bản Cuộc Họp (Meeting Minutes)
                </h3>
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className={buttonClass({ variant: 'primary' })}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ghi lại cuộc họp
                </button>
              </div>

              {meetings.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                  Chưa có biên bản cuộc họp nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((m) => (
                    <div
                      key={m.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-zinc-100 text-base">{m.title}</h4>
                        <span className="text-xs text-zinc-400">
                          {new Date(m.scheduledAt).toLocaleString()} ({m.durationMinutes} phút)
                        </span>
                      </div>
                      {m.summary && (
                        <p className="text-xs text-zinc-300 mt-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                          {m.summary}
                        </p>
                      )}
                      {m.actionItems && m.actionItems.length > 0 && (
                        <div className="mt-3">
                          <span className="text-xs font-semibold text-zinc-400">Action Items:</span>
                          <ul className="mt-1 space-y-1">
                            {m.actionItems.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-zinc-300 flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Ghi chú (entity `document` của /api/work — tên hiển thị đổi, hợp đồng giữ nguyên) */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-200">Ghi chú đã lưu</h3>
                <button
                  onClick={() => setShowDocModal(true)}
                  className={buttonClass({ variant: 'primary' })}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm ghi chú
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                  Chưa có ghi chú nào được lưu.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-zinc-100 text-sm">{doc.title}</h4>
                        <span className="text-[0.6875rem] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                          {doc.documentType}
                        </span>
                      </div>
                      {/* `whitespace-pre-wrap`: nội dung ghi chú dài (tới 10.000 ký tự) có xuống dòng của
                          người viết — không có nó thì mọi đoạn dính liền thành một khối. */}
                      <p className="text-xs text-zinc-300 mt-2 whitespace-pre-wrap break-words">
                        {doc.summary}
                      </p>
                      {doc.contentUri && (
                        <div className="text-xs text-accent-400 theme-light:text-accent-800 mt-3 truncate">
                          URI: {doc.contentUri}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Create Project */}
      {showProjectModal && (
        <Modal title="Tạo dự án mới" onClose={() => setShowProjectModal(false)}>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <Field label="Tên dự án" required>
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    required
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    placeholder="VD: Nâng cấp Platform V2"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div>
              <Field label="Mô tả dự án">
                {(id) => (
                  <textarea
                    id={id}
                    rows={3}
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, description: e.target.value })
                    }
                    placeholder="Chi tiết phạm vi và mục tiêu..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div>
              <Field label="Hạn chót (Deadline)">
                {(id) => (
                  <input
                    id={id}
                    type="date"
                    value={projectForm.deadline}
                    onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                disabled={submitting}
                className={buttonClass({ variant: 'outline' })}
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={buttonClass({ variant: 'primary' })}
              >
                {submitting ? 'Đang lưu…' : 'Tạo dự án'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Create Task */}
      {showTaskModal && (
        <Modal title="Thêm công việc mới" onClose={() => setShowTaskModal(false)}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <Field label="Tiêu đề công việc" required>
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="VD: Viết Unit tests cho Career API"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="work-task-project"
                  className="block text-xs font-medium text-zinc-400 mb-1"
                >
                  Dự án
                </label>
                <select
                  id="work-task-project"
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                >
                  <option value="">Không gán dự án</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="work-task-priority"
                  className="block text-xs font-medium text-zinc-400 mb-1"
                >
                  Độ ưu tiên
                </label>
                <select
                  id="work-task-priority"
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <Field label="Hạn chót">
                {(id) => (
                  <input
                    id={id}
                    type="date"
                    value={taskForm.dueAt}
                    onChange={(e) => setTaskForm({ ...taskForm, dueAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                disabled={submitting}
                className={buttonClass({ variant: 'outline' })}
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={buttonClass({ variant: 'primary' })}
              >
                {submitting ? 'Đang lưu…' : 'Tạo công việc'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Record Meeting */}
      {showMeetingModal && (
        <Modal title="Ghi lại cuộc họp" onClose={() => setShowMeetingModal(false)}>
          <form onSubmit={handleRecordMeeting} className="space-y-4">
            <div>
              <Field label="Tiêu đề cuộc họp" required>
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    required
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                    placeholder="VD: Weekly Sprint Planning"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Field label="Thời gian diễn ra" required>
                  {(id) => (
                    <input
                      id={id}
                      type="datetime-local"
                      required
                      value={meetingForm.scheduledAt}
                      onChange={(e) =>
                        setMeetingForm({ ...meetingForm, scheduledAt: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                    />
                  )}
                </Field>
              </div>
              <div>
                <Field label="Thời lượng (Phút)">
                  {(id) => (
                    <input
                      id={id}
                      type="number"
                      min={5}
                      value={meetingForm.durationMinutes}
                      onChange={(e) =>
                        setMeetingForm({ ...meetingForm, durationMinutes: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                    />
                  )}
                </Field>
              </div>
            </div>
            <div>
              <Field label="Tóm tắt nội dung">
                {(id) => (
                  <textarea
                    id={id}
                    rows={3}
                    value={meetingForm.summary}
                    onChange={(e) => setMeetingForm({ ...meetingForm, summary: e.target.value })}
                    placeholder="Các quyết định và thảo luận chính..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div>
              <Field label="Action items (Mỗi dòng 1 mục)">
                {(id) => (
                  <textarea
                    id={id}
                    rows={2}
                    value={meetingForm.actionItems}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, actionItems: e.target.value })
                    }
                    placeholder="VD: Nam hoàn thiện tài liệu API&#10;Hoa deploy staging..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMeetingModal(false)}
                disabled={submitting}
                className={buttonClass({ variant: 'outline' })}
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={buttonClass({ variant: 'primary' })}
              >
                {submitting ? 'Đang lưu…' : 'Lưu biên bản'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Create Document */}
      {showDocModal && (
        <Modal title="Thêm ghi chú" onClose={() => setShowDocModal(false)}>
          <form onSubmit={handleCreateDocument} className="space-y-4">
            <div>
              <Field label="Tiêu đề tài liệu" required>
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="VD: Architecture Spec V2"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="work-doc-kind"
                  className="block text-xs font-medium text-zinc-400 mb-1"
                >
                  Loại tài liệu
                </label>
                <select
                  id="work-doc-kind"
                  value={docForm.documentType}
                  onChange={(e) =>
                    setDocForm({
                      ...docForm,
                      documentType: e.target.value as
                        'spec' | 'minutes' | 'proposal' | 'report' | 'note',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                >
                  <option value="spec">Technical Spec</option>
                  <option value="minutes">Meeting Minutes</option>
                  <option value="proposal">Proposal</option>
                  <option value="report">Report</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="work-doc-project"
                  className="block text-xs font-medium text-zinc-400 mb-1"
                >
                  Dự án
                </label>
                <select
                  id="work-doc-project"
                  value={docForm.projectId}
                  onChange={(e) => setDocForm({ ...docForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                >
                  <option value="">Không gán dự án</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Field label="Nội dung ghi chú" required>
                {(id) => (
                  <>
                    <textarea
                      id={id}
                      rows={6}
                      required
                      // `maxLength` chặn ngay trên trình duyệt; server VẪN kiểm lại bằng Zod
                      // (`apps/server/src/api/domains/work.ts`) — không tin client (CLAUDE.md 4.2).
                      maxLength={NOTE_CONTENT_MAX_LENGTH}
                      value={docForm.summary}
                      onChange={(e) => setDocForm({ ...docForm, summary: e.target.value })}
                      placeholder="Viết nội dung ghi chú..."
                      aria-describedby={`${id}-dem`}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                    />
                    {/* `aria-live=polite`: người dùng trình đọc màn hình nghe được số ký tự còn
                        lại khi sắp chạm ngưỡng, thay vì chỉ thấy ô nhập lặng lẽ ngừng nhận chữ. */}
                    <p
                      id={`${id}-dem`}
                      aria-live="polite"
                      className="mt-1 text-xs text-zinc-300 text-right"
                    >
                      {docForm.summary.length >= NOTE_COUNTER_THRESHOLD
                        ? `${docForm.summary.length.toLocaleString('vi-VN')}/${NOTE_CONTENT_MAX_LENGTH.toLocaleString('vi-VN')} ký tự — còn ${(NOTE_CONTENT_MAX_LENGTH - docForm.summary.length).toLocaleString('vi-VN')}`
                        : `Tối đa ${NOTE_CONTENT_MAX_LENGTH.toLocaleString('vi-VN')} ký tự`}
                    </p>
                  </>
                )}
              </Field>
            </div>
            <div>
              <Field label="Đường dẫn tài liệu (URI)">
                {(id) => (
                  <input
                    id={id}
                    type="text"
                    value={docForm.contentUri}
                    onChange={(e) => setDocForm({ ...docForm, contentUri: e.target.value })}
                    placeholder="VD: docs/specs/v2-spec.md hoặc https://..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm focus:border-accent-500"
                  />
                )}
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                disabled={submitting}
                className={buttonClass({ variant: 'outline' })}
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={buttonClass({ variant: 'primary' })}
              >
                {submitting ? 'Đang lưu…' : 'Lưu ghi chú'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageShell>
  )

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      <Layout onBack={() => nav('/')} title="Ghi chú" />
      {body}
    </div>
  )
}
