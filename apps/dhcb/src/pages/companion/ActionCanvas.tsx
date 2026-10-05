import { getAuthHeader } from '@core/authHeader'
import { useEffect, useState } from 'react'
import { usePageTitle } from '../../lib/usePageTitle'
import Layout from '../../components/Layout'
import { useToast } from '@core/ToastProvider'
import { ActionCanvasState, CanvasNode, CanvasViewport } from '@dhcb/core-contracts/actionCanvas'
import {
  fetchActionCanvas,
  saveActionCanvas,
  synthesizeGoalCanvas,
  exportCanvasMarkdown,
} from '../../lib/actionCanvasApi.js'
import InteractiveCanvasViewport from '../../components/ActionCanvas/InteractiveCanvasViewport'
import CanvasAiOrchestratorModal from '../../components/ActionCanvas/CanvasAiOrchestratorModal'
import CanvasExportModal from '../../components/ActionCanvas/CanvasExportModal'
import { PageShell } from '@core/PageShell'
import {
  Sparkles,
  LayoutGrid,
  Download,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react'

export default function ActionCanvas() {
  usePageTitle('Kế hoạch hành động | Đồng hành cùng bạn')
  const toast = useToast()
  const [canvas, setCanvas] = useState<ActionCanvasState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<{ markdown: string; title: string }>({
    markdown: '',
    title: '',
  })

  useEffect(() => {
    let mounted = true
    const loadCanvas = async () => {
      setLoading(true)
      try {
        const data = await fetchActionCanvas()
        if (mounted) {
          setCanvas(data)
        }
      } catch {
        if (mounted) {
          toast.error('Không thể tải Action Canvas.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    void loadCanvas()
    return () => {
      mounted = false
    }
  }, [toast])

  const handleSave = async () => {
    if (!canvas || saving) return
    setSaving(true)
    try {
      await saveActionCanvas(canvas)
      toast.success('Đã lưu không gian làm việc!')
    } catch {
      toast.error('Lỗi khi lưu Canvas.')
    } finally {
      setSaving(false)
    }
  }

  const handleSynthesize = async (prompt: string) => {
    try {
      const newCanvas = await synthesizeGoalCanvas(prompt)
      setCanvas(newCanvas)
      toast.success('Đã tạo bản nháp sơ đồ — sửa các nút cho khớp mục tiêu của bạn.')
    } catch {
      toast.error('Chưa tạo được sơ đồ. Thử lại nhé.')
    }
  }

  const handleAutoLayout = async () => {
    if (!canvas) return
    try {
      const res = await fetch('/api/action-canvas?action=auto_layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = await res.json()
        setCanvas(data.canvas)
        toast.success('Đã tự động căn chỉnh sơ đồ!')
      }
    } catch {
      toast.error('Lỗi khi tự động sắp xếp.')
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportCanvasMarkdown()
      setExportData(data)
      setExportModalOpen(true)
    } catch {
      toast.error('Lỗi khi xuất tài liệu.')
    }
  }

  const handleAddNode = () => {
    if (!canvas) return
    const now = new Date().toISOString()
    const newNode: CanvasNode = {
      id: 'node-' + Date.now(),
      type: 'task',
      title: 'Nhiệm vụ mới',
      content: 'Nhấn để chỉnh sửa nội dung chi tiết...',
      domain: 'learning',
      x: 350 - canvas.viewport.panX,
      y: 200 - canvas.viewport.panY,
      width: 220,
      height: 120,
      color: '#38bdf8',
      status: 'in_progress',
      tags: [],
      assignedTo: 'user',
      createdAt: now,
      updatedAt: now,
    }

    setCanvas({
      ...canvas,
      nodes: [...canvas.nodes, newNode],
      updatedAt: now,
    })
    setSelectedNodeId(newNode.id)
    toast.success('Đã thêm thẻ nhiệm vụ mới!')
  }

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    if (!canvas) return
    setCanvas({
      ...canvas,
      nodes: canvas.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    })
  }

  const handleDeleteNode = (id: string) => {
    if (!canvas) return
    setCanvas({
      ...canvas,
      nodes: canvas.nodes.filter((n) => n.id !== id),
      edges: canvas.edges.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id),
    })
    setSelectedNodeId(null)
  }

  const handleUpdateViewport = (viewport: CanvasViewport) => {
    if (!canvas) return
    setCanvas({
      ...canvas,
      viewport,
    })
  }

  const zoomIn = () => {
    if (!canvas) return
    const zoom = Math.min(3.0, canvas.viewport.zoom + 0.15)
    setCanvas({ ...canvas, viewport: { ...canvas.viewport, zoom } })
  }

  const zoomOut = () => {
    if (!canvas) return
    const zoom = Math.max(0.3, canvas.viewport.zoom - 0.15)
    setCanvas({ ...canvas, viewport: { ...canvas.viewport, zoom } })
  }

  const resetView = () => {
    if (!canvas) return
    setCanvas({ ...canvas, viewport: { zoom: 1.0, panX: 0, panY: 0 } })
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      <Layout back={true} title="Không gian làm việc trực quan (Action Canvas)" />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] width="standard"; giữ bố cục flex cột full-height. */}
      <PageShell width="standard" baseWidth="max-w-6xl" className="!pt-4 flex flex-1 flex-col">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Không Gian Làm Việc Trực Quan (Action Canvas)
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-zinc-950 hover:opacity-90 shadow-md transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tạo sơ đồ từ mục tiêu
            </button>
            <button
              type="button"
              onClick={handleAddNode}
              className="tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Thẻ
            </button>
            <button
              type="button"
              onClick={handleAutoLayout}
              className="tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 theme-light:text-cyan-800" />
              Tự Động Bố Cục
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-800 p-0.5">
              <button
                type="button"
                onClick={zoomOut}
                className="p-1.5 text-zinc-400 hover:text-zinc-200"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono text-zinc-400">
                {canvas ? Math.round(canvas.viewport.zoom * 100) : 100}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                className="p-1.5 text-zinc-400 hover:text-zinc-200"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 border-l border-zinc-800"
                title="Đặt lại góc nhìn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-950/60 theme-light:bg-emerald-50 hover:bg-emerald-900/60 text-emerald-300 theme-light:text-emerald-800 border border-emerald-700/40 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Markdown
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="tap-44 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Lưu
            </button>
          </div>
        </div>

        {loading || !canvas ? (
          <div className="flex flex-col items-center justify-center h-[500px] rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <Loader2 className="w-8 h-8 text-cyan-400 theme-light:text-cyan-800 animate-spin mb-2" />
            <span className="text-xs text-zinc-400">Đang khởi tạo không gian Action Canvas...</span>
          </div>
        ) : (
          <InteractiveCanvasViewport
            nodes={canvas.nodes}
            edges={canvas.edges}
            viewport={canvas.viewport}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onUpdateNodePosition={handleUpdatePosition}
            onDeleteNode={handleDeleteNode}
            onUpdateViewport={handleUpdateViewport}
          />
        )}
      </PageShell>

      <CanvasAiOrchestratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSynthesize={handleSynthesize}
      />

      <CanvasExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        markdown={exportData.markdown}
        title={exportData.title}
      />
    </div>
  )
}
