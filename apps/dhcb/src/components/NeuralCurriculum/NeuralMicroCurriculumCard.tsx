import { useEffect, useState } from 'react'
import {
  NeuralCurriculumState,
  type NeuralDrillSubmission,
} from '@dhcb/core-contracts/neuralCurriculum'
import {
  fetchNeuralCurriculum,
  generateMicroModule,
  completeDrill,
} from '../../lib/neuralCurriculumApi.js'
import CollocationGraphExplorer from './CollocationGraphExplorer'
import MicroDrillModal from './MicroDrillModal'
import { useToast } from '@core/ToastProvider'
import { BrainCircuit, Zap, Sparkles, ChevronRight, Loader2 } from 'lucide-react'

export default function NeuralMicroCurriculumCard() {
  const toast = useToast()
  const [state, setState] = useState<NeuralCurriculumState | null>(null)
  const [loading, setLoading] = useState(true)
  const [drillModalOpen, setDrillModalOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Nạp lần đầu lúc mount — hàm async định nghĩa TRONG effect, mọi setState
  // nằm sau await (không setState đồng bộ trong thân effect).
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNeuralCurriculum()
        setState(data)
      } catch {
        // im lặng nếu offline
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleGenerate = async (topic: string) => {
    setGenerating(true)
    try {
      const result = await generateMicroModule({ topicOrKeyword: topic })
      setState(result.state)
      toast.success('Đã tạo bài học vi mô: ' + topic)
    } catch {
      toast.error('Lỗi khi tạo bài học vi mô.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCompleteDrill = async (answers: NeuralDrillSubmission['answers']) => {
    const moduleId = state?.modules[0]?.moduleId
    if (!moduleId) throw new Error('Không tìm thấy bài luyện.')
    const result = await completeDrill({ moduleId, answers })
    setState(result.state)
    return result.review
  }

  if (loading || !state) return null
  const activeModule = state.modules[0]

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/20 theme-light:from-sky-50 via-zinc-950 to-zinc-950 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 theme-light:text-sky-900 border border-sky-500/30 shadow-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              Lộ Trình Vi Mô Thần Kinh (Neural Micro-Curriculum)
              <span className="rounded px-1.5 py-0.2 text-[0.6875rem] font-semibold uppercase bg-sky-500/30 text-sky-300 theme-light:text-sky-900">
                V4.3 Dynamic
              </span>
            </h3>
            <p className="text-[0.6875rem] text-zinc-400">
              Học theo mạng lưới Collocations đắt giá & micro-drills 2 phút tự động thích ứng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[0.6875rem] text-zinc-400 block">Mastery</span>
            <span className="text-xs font-bold text-sky-400 theme-light:text-sky-900 font-mono">
              {state.masteryScore}%
            </span>
          </div>
        </div>
      </div>

      {activeModule && (
        <CollocationGraphExplorer
          collocations={activeModule.collocations}
          title={activeModule.title}
        />
      )}

      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={generating}
            onClick={() => handleGenerate('Đàm phán hợp đồng & deal giá')}
            className="text-[0.6875rem] font-medium text-sky-400 theme-light:text-sky-900 hover:text-sky-300 bg-sky-950/40 theme-light:bg-sky-50 hover:bg-sky-900/40 theme-light:hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-500/30 transition flex items-center gap-1"
          >
            {generating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>Đổi chủ đề: Đàm phán</span>
          </button>
        </div>

        {activeModule && activeModule.drills.length > 0 && (
          <button
            type="button"
            onClick={() => setDrillModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 text-zinc-950 hover:bg-sky-400 transition shadow-md"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Luyện Nhanh 2 Phút
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {activeModule && (
        <MicroDrillModal
          key={activeModule.moduleId}
          isOpen={drillModalOpen}
          onClose={() => setDrillModalOpen(false)}
          drills={activeModule.drills}
          onComplete={handleCompleteDrill}
        />
      )}
    </div>
  )
}
