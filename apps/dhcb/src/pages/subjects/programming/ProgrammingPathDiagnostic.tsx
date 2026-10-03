// ProgrammingPathDiagnostic — chẩn đoán CHỌN ĐIỂM VÀO cho một lộ trình mục tiêu
// (`/lap-trinh/lo-trinh/:pathId/chan-doan`). Đặc tả: đợt 2/4 của
// docs/specs/2026-08-31-khoa-hoc-ky-su-truong-ai.md.
//
// Luật số 1 của sản phẩm: đây là CÔNG CỤ CHỌN VIỆC, không phải bảng chấm điểm. Trang này KHÔNG
// bao giờ hiện điểm số/phần trăm đúng — chỉ hiện MỘT đề xuất điểm vào bằng tên chặng, và người
// học được SỬA TAY đề xuất đó trước khi lưu (chọn một chặng khác trong danh sách thả xuống).
// Chấm hoàn toàn ở CLIENT, tất định (`suggestEntry`), không gọi AI.
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@core/PageShell'
import { CheckCircle2, Compass, ListChecks } from 'lucide-react'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../context/useAuth'
import { savePathStages } from '../../../lib/programmingPathProgress'
import { getLearningPath, pathStageRefs } from '@dhcb/subject-programming/learningPaths/registry'
import {
  PRINCIPAL_AI_DIAGNOSTIC,
  suggestEntry,
  type DiagnosticAnswer,
} from '@dhcb/subject-programming/learningPaths/diagnostic'
import { getSpecStage } from '@dhcb/subject-programming/specializations/registry'
import { idFromSlugSegment } from '@core/slug'
import { PROGRAMMING_PREFIX, duongDanLoTrinh } from '../../../lib/programmingRoutes'
import { usePageTitle } from '../../../lib/usePageTitle'

export default function ProgrammingPathDiagnostic() {
  const nav = useNavigate()
  const { pathId } = useParams()
  const { user } = useAuth()
  const path = getLearningPath(idFromSlugSegment(pathId ?? ''))
  usePageTitle(`${path ? `Chẩn đoán: ${path.title}` : 'Chẩn đoán lộ trình'} | Môn Lập trình`)

  const [chosen, setChosen] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [entryStageId, setEntryStageId] = useState<string | null>(null)
  const [skippedStageIds, setSkippedStageIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Câu hỏi hiện dùng chung cho mọi lộ trình — đợt sau nếu có lộ trình thứ hai sẽ tách theo
  // pathId. Đợt này chỉ có 'principal-ai' nên bank câu hỏi cố định là đủ.
  const questions = PRINCIPAL_AI_DIAGNOSTIC
  const allStageIds = useMemo(() => (path ? pathStageRefs(path).map((r) => r.stageId) : []), [path])

  if (!path) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Layout onBack={() => nav(PROGRAMMING_PREFIX)} title="Không có lộ trình này" />
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] */}
        <PageShell width="standard" baseWidth="max-w-4xl">
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            Không có lộ trình này
          </h1>
        </PageShell>
      </div>
    )
  }

  const answered = Object.keys(chosen).length
  const canSubmit = answered === questions.length

  function handleSubmit() {
    const answers: DiagnosticAnswer[] = questions.map((q) => ({
      questionId: q.id,
      correct: chosen[q.id] === q.answerIndex,
    }))
    const result = suggestEntry(path!, answers, questions)
    setEntryStageId(result.entryStageId)
    setSkippedStageIds(result.skippedStageIds)
    setSubmitted(true)
  }

  async function handleSave() {
    if (!user || !entryStageId) return
    setSaving(true)
    const stages = [
      ...skippedStageIds.map((stageId) => ({ stageId, status: 'skipped' as const })),
      { stageId: entryStageId, status: 'in_progress' as const },
    ]
    const ok = await savePathStages(path!.id, stages)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => nav(duongDanLoTrinh(path!)), 900)
    }
  }

  if (submitted) {
    const entryStage = entryStageId ? getSpecStage(entryStageId) : undefined
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Layout onBack={() => nav(duongDanLoTrinh(path))} title="Gợi ý điểm bắt đầu" />
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] */}
        <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            Gợi ý điểm bắt đầu
          </h1>
          <section className="rounded-3xl border border-accent-500/40 bg-zinc-900 p-5 space-y-3">
            <p className="text-sm text-zinc-300 leading-relaxed flex items-start gap-2">
              <Compass className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Bạn có thể bắt đầu từ{' '}
                <strong className="text-white">{entryStage?.name ?? entryStageId}</strong>.
              </span>
            </p>
            {skippedStageIds.length > 0 && (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Đề xuất miễn {skippedStageIds.length} chặng bạn có vẻ đã vững — vào trang lộ trình
                vẫn xem lại được bất cứ lúc nào.
              </p>
            )}
            <label className="block text-xs font-semibold text-zinc-300 pt-1" htmlFor="entry-pick">
              Muốn bắt đầu từ chặng khác? Chọn lại ở đây:
            </label>
            <select
              id="entry-pick"
              value={entryStageId ?? ''}
              onChange={(e) => setEntryStageId(e.target.value)}
              className="tap-44 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100"
            >
              {allStageIds.map((id) => (
                <option key={id} value={id}>
                  {getSpecStage(id)?.name ?? id}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleSave()}
              disabled={saving || saved || !user}
              className="tap-44 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-sm transition active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>{saved ? 'Đã lưu' : saving ? 'Đang lưu…' : 'Lưu và bắt đầu'}</span>
            </button>
          </section>
        </PageShell>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* Breadcrumb: đốt cha động = lộ trình đang chẩn đoán. */}
      <Layout
        onBack={() => nav(duongDanLoTrinh(path))}
        crumbs={[{ label: path.title, to: duongDanLoTrinh(path) }]}
        title={`Chẩn đoán: ${path.title}`}
      />
      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">{`Chẩn đoán: ${path.title}`}</h1>
        <ol className="space-y-4">
          {questions.map((q, idx) => (
            <li
              key={q.id}
              className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-4 space-y-2.5"
            >
              <p className="text-sm font-semibold text-white flex items-start gap-2">
                <ListChecks
                  className="w-4 h-4 text-accent-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  Câu {idx + 1}: {q.prompt}
                </span>
              </p>
              <div className="space-y-1.5">
                {q.choices.map((choice, ci) => (
                  <label
                    key={ci}
                    className="tap-44 flex items-center gap-2.5 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={chosen[q.id] === ci}
                      onChange={() => setChosen((c) => ({ ...c, [q.id]: ci }))}
                    />
                    <span className="text-sm text-zinc-200">{choice}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="tap-44 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-sm transition active:scale-[0.98]"
        >
          <span>
            Xem gợi ý điểm bắt đầu ({answered}/{questions.length})
          </span>
        </button>
      </PageShell>
    </div>
  )
}
