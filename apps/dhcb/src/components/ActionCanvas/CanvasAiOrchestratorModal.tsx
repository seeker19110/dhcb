// CanvasAiOrchestratorModal — "Tạo sơ đồ từ mục tiêu" của Action Canvas.
//
// [2026-10-09, changelog 0549 — đặc tả docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md]
// Trước đây nút này dựng KHUNG MẪU 4 thẻ "Ví dụ" giống nhau cho mọi mục tiêu. Nay AI ĐỀ XUẤT phân
// rã thật, và hộp thoại đi qua các bước rõ ràng:
//   form   → nhập mục tiêu; hai lối: "Đề xuất bằng AI (1 lượt)" hoặc "Tự bắt đầu, không dùng AI";
//   loading→ đang chờ AI (không đóng được — lượt đã trừ, đóng là mất kết quả);
//   review → ĐỀ XUẤT có nhãn trung thực: người dùng bỏ chọn / sửa tên từng bước rồi mới bấm Lưu.
//            Không gì được lưu hay thực hiện tự động (skill autonomous-agent-orchestrator §1, §4.3);
//   quota  → hết lượt AI: nói thật + mời tự bắt đầu với thẻ mục tiêu (canvas trống).
// Lỗi AI/đầu ra hỏng hiện tại chỗ (role="alert"), giữ nguyên câu mục tiêu để thử lại.
import React, { useMemo, useState } from 'react'
import { useDialogBehavior } from '../useDialogBehavior'
import { Sparkles, X, Loader2, ArrowRight, PencilLine, Save, RefreshCw, Info } from 'lucide-react'
import {
  CANVAS_DOMAIN_LABELS,
  type ActionCanvasState,
  type CanvasNode,
} from '@dhcb/core-contracts/actionCanvas'
import type { SynthesizeResult } from '../../lib/actionCanvasApi'
import { applyProposalEdits, proposalGoalId } from '../../lib/actionCanvasProposal'
import { buttonClass } from '@core/buttonStyles'

/** Khớp trần server (`GOAL_MAX` ở packages/core-personal/goalDecomposition.ts). */
const GOAL_MAX_CHARS = 300
const GOAL_MIN_CHARS = 3

interface CanvasAiOrchestratorModalProps {
  isOpen: boolean
  onClose: () => void
  /** Gọi server lấy ĐỀ XUẤT (không lưu). */
  onRequestProposal: (goal: string) => Promise<SynthesizeResult>
  /** Người dùng đã xem/sửa và bấm Lưu. Trả `false` nếu người dùng huỷ (vd không muốn thay sơ
   *  đồ cũ); NÉM lỗi khi lưu thất bại để hộp thoại giữ nguyên bản đã sửa. */
  onAcceptProposal: (canvas: ActionCanvasState) => Promise<boolean>
  /** Lối không dùng AI: dựng canvas chỉ có thẻ mục tiêu. Trả `false` nếu người dùng huỷ. */
  onStartManual: (goal: string) => boolean
}

// Mục tiêu mẫu — chỉ thuộc hai khu vực còn thật của ứng dụng (Học tập, Ghi chú).
const SAMPLE_GOALS = [
  'Đạt IELTS 6.5 trong 6 tháng',
  'Học Python đủ để tự động hoá báo cáo Excel ở chỗ làm',
  'Mỗi tuần đọc xong một cuốn sách và ghi tóm tắt',
]

type Phase =
  | { name: 'form'; error: string | null }
  | { name: 'loading' }
  | { name: 'review'; proposal: ActionCanvasState }
  | { name: 'quota'; message: string }

export default function CanvasAiOrchestratorModal({
  isOpen,
  onClose,
  onRequestProposal,
  onAcceptProposal,
  onStartManual,
}: CanvasAiOrchestratorModalProps) {
  const [goal, setGoal] = useState('')
  const [phase, setPhase] = useState<Phase>({ name: 'form', error: null })
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const busy = phase.name === 'loading' || saving
  const resetAndClose = () => {
    setPhase({ name: 'form', error: null })
    setRemoved(new Set())
    setTitles({})
    setSaveError(null)
    onClose()
  }
  // Đang chờ AI/đang lưu thì không đóng (Escape, nút X, bấm nền): lượt đã trừ, đóng là mất kết quả.
  const guardedClose = () => {
    if (!busy) resetAndClose()
  }
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(guardedClose, isOpen)

  const trimmedGoal = goal.trim()
  const goalTooShort = trimmedGoal.length < GOAL_MIN_CHARS

  if (!isOpen) return null

  const requestProposal = async () => {
    if (goalTooShort || busy) return
    setPhase({ name: 'loading' })
    const result = await onRequestProposal(trimmedGoal)
    if (result.kind === 'ok') {
      setRemoved(new Set())
      setTitles({})
      setSaveError(null)
      setPhase({ name: 'review', proposal: result.proposal })
    } else if (result.kind === 'quota') {
      setPhase({ name: 'quota', message: result.message })
    } else {
      setPhase({ name: 'form', error: result.message })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void requestProposal()
  }

  const startManual = () => {
    if (goalTooShort || busy) return
    if (onStartManual(trimmedGoal)) resetAndClose()
  }

  const save = async (proposal: ActionCanvasState) => {
    if (busy) return
    setSaving(true)
    setSaveError(null)
    try {
      const accepted = await onAcceptProposal(applyProposalEdits(proposal, { removed, titles }))
      if (accepted) resetAndClose()
    } catch {
      setSaveError('Chưa lưu được. Bản bạn đang sửa vẫn còn đây — thử bấm Lưu lại nhé.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        aria-busy={busy}
        className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-zinc-900 p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto focus:outline-none"
      >
        <button
          type="button"
          onClick={guardedClose}
          disabled={busy}
          aria-label="Đóng"
          className="tap-44 absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-2 mb-4 pr-10">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 theme-light:text-cyan-900 border border-cyan-500/30">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-bold text-zinc-100">
              {phase.name === 'review' ? 'Xem lại đề xuất của AI' : 'Tạo sơ đồ từ mục tiêu'}
            </h2>
            {phase.name !== 'review' && (
              <p className="text-xs text-zinc-300 leading-relaxed">
                AI đề xuất các bước cho mục tiêu của bạn. Bạn xem, sửa, bỏ bớt rồi mới lưu — không
                có gì được lưu hay thực hiện tự động. Mỗi lần đề xuất dùng 1 lượt AI trong hạn mức
                hằng ngày.
              </p>
            )}
          </div>
        </div>

        {phase.name === 'review' ? (
          <ProposalReview
            proposal={phase.proposal}
            removed={removed}
            titles={titles}
            saving={saving}
            saveError={saveError}
            onToggle={(id) =>
              setRemoved((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
            onRename={(id, value) => setTitles((prev) => ({ ...prev, [id]: value }))}
            onBack={() => setPhase({ name: 'form', error: null })}
            onSave={() => void save(phase.proposal)}
          />
        ) : phase.name === 'quota' ? (
          <div className="space-y-4">
            <div
              role="alert"
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 theme-light:bg-amber-50 p-3"
            >
              <p className="text-sm font-semibold text-amber-100 theme-light:text-amber-900">
                Chưa dùng được AI lúc này
              </p>
              <p className="text-sm text-amber-100 theme-light:text-amber-900">{phase.message}</p>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Bạn vẫn tự lập sơ đồ được: bắt đầu với thẻ mục tiêu &ldquo;{trimmedGoal}&rdquo;, rồi
              bấm &ldquo;Thêm thẻ&rdquo; cho từng bước.
            </p>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={resetAndClose}
                className={buttonClass({ variant: 'ghost', size: 'sm', className: 'tap-44' })}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={startManual}
                className={buttonClass({ variant: 'primary', size: 'sm', className: 'tap-44' })}
              >
                <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
                Tự bắt đầu với thẻ mục tiêu
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="canvas-goal-input"
                className="block text-xs font-semibold text-zinc-200 mb-1.5"
              >
                Mục tiêu của bạn
              </label>
              <textarea
                id="canvas-goal-input"
                rows={3}
                value={goal}
                maxLength={GOAL_MAX_CHARS}
                disabled={phase.name === 'loading'}
                aria-describedby="canvas-goal-count"
                onChange={(e) => setGoal(e.target.value)}
                placeholder="VD: Đạt IELTS 6.5 trong 6 tháng để nộp hồ sơ học bổng"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-cyan-500 focus:outline-none disabled:opacity-70"
              />
              <p id="canvas-goal-count" className="mt-1 text-right text-xs text-zinc-300">
                {goal.length}/{GOAL_MAX_CHARS} ký tự
              </p>
            </div>

            {phase.name === 'form' && (
              <div>
                <span className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Hoặc chọn một mục tiêu mẫu:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SAMPLE_GOALS.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setGoal(sample)}
                      className="tap-44 flex items-center justify-between text-left text-xs p-2 rounded-lg bg-zinc-950 text-zinc-200 hover:bg-cyan-950/40 theme-light:hover:bg-cyan-100 border border-zinc-800/80 transition"
                    >
                      <span className="line-clamp-2">{sample}</span>
                      <ArrowRight
                        className="w-3 h-3 ml-2 flex-shrink-0 text-zinc-400"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase.name === 'form' && phase.error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/40 bg-red-500/10 theme-light:bg-red-50 p-3 text-sm text-red-100 theme-light:text-red-900"
              >
                {phase.error}
              </div>
            )}

            {phase.name === 'loading' && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 theme-light:bg-cyan-50 p-3 text-sm text-zinc-100"
              >
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />
                AI đang chia mục tiêu thành các bước… thường mất vài giây.
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={startManual}
                disabled={goalTooShort || busy}
                className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
              >
                <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
                Tự bắt đầu, không dùng AI
              </button>
              <button
                type="submit"
                disabled={goalTooShort || busy}
                className={buttonClass({ variant: 'primary', size: 'sm', className: 'tap-44' })}
              >
                {phase.name === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                Đề xuất bằng AI (1 lượt)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

interface ProposalReviewProps {
  proposal: ActionCanvasState
  removed: ReadonlySet<string>
  titles: Readonly<Record<string, string>>
  saving: boolean
  saveError: string | null
  onToggle: (id: string) => void
  onRename: (id: string, value: string) => void
  onBack: () => void
  onSave: () => void
}

function ProposalReview({
  proposal,
  removed,
  titles,
  saving,
  saveError,
  onToggle,
  onRename,
  onBack,
  onSave,
}: ProposalReviewProps) {
  const goalId = proposalGoalId(proposal)
  const goalNode = proposal.nodes.find((n) => n.id === goalId)
  const steps = proposal.nodes.filter((n) => n.id !== goalId)
  // "Làm sau: …" — tên các bước phải xong trước (bỏ cạnh từ mục tiêu).
  const prereqTitles = useMemo(() => {
    const byId = new Map<string, CanvasNode>(proposal.nodes.map((n) => [n.id, n]))
    const map = new Map<string, string[]>()
    for (const e of proposal.edges) {
      if (e.sourceNodeId === goalId) continue
      const src = byId.get(e.sourceNodeId)
      if (!src) continue
      map.set(e.targetNodeId, [...(map.get(e.targetNodeId) ?? []), src.title])
    }
    return map
  }, [proposal, goalId])
  const keptCount = steps.filter((s) => !removed.has(s.id)).length

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 theme-light:bg-amber-50 p-3">
        <Info
          className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-200 theme-light:text-amber-900"
          aria-hidden="true"
        />
        <p className="text-sm text-amber-100 theme-light:text-amber-900 leading-relaxed">
          Đây là <strong>đề xuất của AI</strong>, có thể chưa hợp với hoàn cảnh của bạn. Bỏ chọn
          bước không cần, sửa tên cho đúng việc của bạn rồi mới lưu. Chưa có gì được lưu.
        </p>
      </div>

      {goalNode && (
        <p className="text-sm text-zinc-200">
          <span className="font-semibold">Mục tiêu:</span> {goalNode.title}
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-semibold text-zinc-200">
          Các bước đề xuất ({keptCount}/{steps.length} bước được giữ)
        </legend>
        <ol className="space-y-2">
          {steps.map((step, idx) => {
            const kept = !removed.has(step.id)
            const checkboxId = `canvas-step-keep-${step.id}`
            const inputId = `canvas-step-title-${step.id}`
            const prereqs = prereqTitles.get(step.id)
            return (
              <li
                key={step.id}
                className={`rounded-xl border p-3 ${kept ? 'border-zinc-700 bg-zinc-950' : 'border-zinc-800 bg-zinc-900 opacity-70'}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={kept}
                    onChange={() => onToggle(step.id)}
                    className="h-5 w-5 flex-shrink-0 accent-cyan-500"
                  />
                  <label htmlFor={checkboxId} className="text-xs font-semibold text-zinc-200">
                    Giữ bước {idx + 1}
                  </label>
                  <span className="ml-auto rounded-md border border-zinc-700 px-1.5 py-0.5 text-xs text-zinc-200">
                    {CANVAS_DOMAIN_LABELS[step.domain]}
                  </span>
                </div>
                <label htmlFor={inputId} className="sr-only">
                  Tên bước {idx + 1}
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={titles[step.id] ?? step.title}
                  maxLength={200}
                  disabled={!kept}
                  onChange={(e) => onRename(step.id, e.target.value)}
                  className="mt-2 w-full min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none disabled:opacity-70"
                />
                {step.content && (
                  <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{step.content}</p>
                )}
                {prereqs && (
                  <p className="mt-1 text-xs text-zinc-300">Làm sau: {prereqs.join(' · ')}</p>
                )}
              </li>
            )
          })}
        </ol>
      </fieldset>

      {saveError && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 theme-light:bg-red-50 p-3 text-sm text-red-100 theme-light:text-red-900"
        >
          {saveError}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Sửa mục tiêu, đề xuất lại
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || keptCount === 0}
          className={buttonClass({ variant: 'primary', size: 'sm', className: 'tap-44' })}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          Lưu vào sơ đồ
        </button>
      </div>
    </div>
  )
}
