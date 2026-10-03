// ProgrammingPathPage — TRANG TỔNG QUAN MỘT LỘ TRÌNH MỤC TIÊU (`/lap-trinh/lo-trinh/:pathId`).
//
// Đặc tả: `docs/specs/2026-08-31-khoa-hoc-ky-su-truong-ai.md` (đợt 1). Trang này là bảng lắp
// ghép: mỗi giai đoạn liệt kê các CHẶNG của những hướng chuyên sâu có sẵn, kèm lý do vì sao
// chặng đó nằm ở vị trí đó. Ba luật hiển thị:
//  · Chỉ hiện nút "Vào học" ở chặng ĐÃ có bài thật (`unitsOfStage` > 0) — không hứa suông.
//  · Giai đoạn stages rỗng = ĐANG SOẠN, nói rõ, không giấu.
//  · Trạng thái "đã xong" đọc từ tiến độ hướng sẵn có (đợt 1 CHỈ ĐỌC — tiến độ riêng của lộ
//    trình là việc của đợt 2).
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@core/PageShell'
import {
  Map,
  Clock,
  Lock,
  CheckCircle2,
  Play,
  Hammer,
  Award,
  Target,
  Sparkles,
  Compass,
  BookOpen,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../context/useAuth'
import {
  fetchSpecProgress,
  isStageCompleted,
  EMPTY_SPEC_PROGRESS,
  type SpecProgressSnapshot,
} from '../../../lib/programmingSpecProgress'
import {
  fetchPathProgress,
  isPathStageDone,
  isPathStageSkipped,
  type PathStageProgress,
} from '../../../lib/programmingPathProgress'
import {
  getLearningPath,
  pathStageRefs,
  isPhaseDrafting,
} from '@dhcb/subject-programming/learningPaths/registry'
import { stageHasQuiz } from '@dhcb/subject-programming/learningPaths/stageQuizzes'
import { getSpecStage } from '@dhcb/subject-programming/specializations/registry'
import { unitsOfStage } from '@dhcb/subject-programming/specializations/stageUnits'
import { getPathStage } from '@dhcb/subject-programming/learningPaths/pathStages'
import { idFromSlugSegment } from '@core/slug'
import { PROGRAMMING_LEVELS } from '@dhcb/subject-programming/curriculum'
import {
  fetchProgress as fetchLessonProgress,
  type ProgrammingLessonProgress,
} from '../../../lib/programmingProgress'
import { countCompletedByLevel } from '../../../lib/programmingNextLesson'
import {
  duongDanBac,
  duongDanChanDoan,
  duongDanChangLoTrinh,
  duongDanLoTrinh,
  PROGRAMMING_PREFIX,
} from '../../../lib/programmingRoutes'
import { duongDanChangTheoId, duongDanHuongTheoChangId } from '../../../lib/programmingRoutesSpec'
import PathStageQuiz from '../../../components/PathStageQuiz'
import PathArtifactVault from '../../../components/PathArtifactVault'
import { usePageTitle } from '../../../lib/usePageTitle'

export default function ProgrammingPathPage() {
  const nav = useNavigate()
  // URL là `<mã lộ trình>--<tiêu đề đã slug hoá>`; mã đứng đầu nên link cũ vẫn tra ra đúng.
  const { pathId: pathSlugParam } = useParams()
  const { user } = useAuth()
  const [progress, setProgress] = useState<SpecProgressSnapshot>(EMPTY_SPEC_PROGRESS)
  const [pathProgress, setPathProgress] = useState<PathStageProgress[]>([])
  const [foundationProgress, setFoundationProgress] = useState<ProgrammingLessonProgress[]>([])

  const path = getLearningPath(idFromSlugSegment(pathSlugParam ?? ''))
  usePageTitle(`${path ? `Lộ trình: ${path.title}` : 'Lộ trình'} | Môn Lập trình`)

  const reloadPathProgress = () => {
    if (!user || !path) return
    void fetchPathProgress(user.id, path.id).then(setPathProgress)
  }

  useEffect(() => {
    if (!user || !path) return
    void fetchSpecProgress(user.id).then(setProgress)
    void fetchPathProgress(user.id, path.id).then(setPathProgress)
    void fetchLessonProgress(user.id).then(setFoundationProgress)
  }, [user, path])

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

  const allRefs = pathStageRefs(path)
  const doneCount = allRefs.filter((r) => isStageCompleted(progress, r.stageId)).length
  const foundationLevels = (path.foundationLevelIds ?? []).flatMap((levelId) => {
    const level = PROGRAMMING_LEVELS.find((candidate) => candidate.id === levelId)
    return level ? [level] : []
  })

  // Link cũ (chỉ mã) hoặc tiêu đề lộ trình đã đổi → về URL chuẩn.
  const canonicalPath = duongDanLoTrinh(path)
  if (`${PROGRAMMING_PREFIX}/lo-trinh/${pathSlugParam ?? ''}` !== canonicalPath) {
    return <Navigate to={canonicalPath} replace />
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout onBack={() => nav(PROGRAMMING_PREFIX)} title={`Lộ trình: ${path.title}`} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">{`Lộ trình: ${path.title}`}</h1>

        {/* Thông tin đầu vào + tiến độ tổng — đọc từ tiến độ hướng sẵn có */}
        <section className="rounded-3xl border border-accent-500/40 bg-zinc-900 p-5 space-y-3">
          <p className="text-sm text-zinc-200 leading-relaxed">{path.forWho}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Lock className="w-3 h-3" aria-hidden="true" />
              {foundationLevels.length > 0 ? 'Phần chuyên sâu nên xong bậc ' : 'Nên xong bậc '}
              {path.prerequisite.toUpperCase()} trước
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {path.duration}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Map className="w-3 h-3" aria-hidden="true" />
              {doneCount}/{allRefs.length} chặng xong
            </span>
          </div>
          {user && (
            <button
              onClick={() => nav(duongDanChanDoan(path))}
              className="tap-44 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-accent-500/60 text-zinc-200 font-semibold text-xs transition active:scale-[0.98]"
            >
              <Compass className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
              <span>Chưa biết bắt đầu từ đâu? Làm chẩn đoán chọn điểm vào</span>
            </button>
          )}
        </section>

        {foundationLevels.length > 0 && (
          <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-400 shrink-0" aria-hidden="true" />
                <span>Chặng nền tảng — bắt đầu từ số 0</span>
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Chưa từng lập trình, bạn bắt đầu ở P1. Nếu đã có kinh nghiệm, làm chẩn đoán phía
                trên để tìm điểm vào phù hợp — không cần học lại điều đã vững.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {foundationLevels.map((level) => {
                const levelProgress = countCompletedByLevel(foundationProgress, level.id)
                const completed =
                  levelProgress.total > 0 && levelProgress.done === levelProgress.total
                return (
                  <li
                    key={level.id}
                    className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {level.id.toUpperCase()} · {level.name}
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed mt-1">{level.canDo}</p>
                      </div>
                      {completed && (
                        <CheckCircle2
                          className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900 shrink-0"
                          aria-label="Đã hoàn thành bậc nền tảng"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {levelProgress.done}/{levelProgress.total} bài · {level.duration}
                      </span>
                      <button
                        onClick={() => nav(duongDanBac(level))}
                        className="tap-44 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-xs transition active:scale-[0.98]"
                      >
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{completed ? 'Ôn lại bậc này' : 'Học bậc này'}</span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {/* Các giai đoạn */}
        {path.phases.map((phase, idx) => (
          <section
            key={phase.id}
            className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-sm"
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-400 shrink-0" aria-hidden="true" />
              <span>
                Giai đoạn {idx + 1}: {phase.name}
              </span>
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{phase.canDo}</p>

            {isPhaseDrafting(phase) ? (
              <p className="flex items-start gap-2 text-sm text-zinc-300 rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
                <Hammer className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Nội dung giai đoạn này <strong>đang soạn</strong> — sẽ mở sau. Bạn cứ đi các giai
                  đoạn trước, tới đây là kịp.
                </span>
              </p>
            ) : (
              <ol className="space-y-2">
                {phase.stages.map((ref) => {
                  // Chặng có thể sống ở hai tầng: hướng chuyên sâu (nguồn chính) HOẶC chặng
                  // RIÊNG của lộ trình (P5 "Tầm trưởng", principal-s1…s4) — thử tầng hướng
                  // trước, đúng thứ tự ưu tiên của resolveStage().
                  const specStage = getSpecStage(ref.stageId)
                  const pathOwnStage = specStage ? undefined : getPathStage(ref.stageId)
                  const stage = specStage ?? pathOwnStage
                  const xong =
                    isStageCompleted(progress, ref.stageId) ||
                    isPathStageDone(pathProgress, ref.stageId)
                  const mien = !xong && isPathStageSkipped(pathProgress, ref.stageId)
                  const coBai = unitsOfStage(ref.stageId).length > 0
                  const duongVaoHoc = pathOwnStage
                    ? duongDanChangLoTrinh(path, pathOwnStage)
                    : (duongDanChangTheoId(ref.stageId) ?? `${PROGRAMMING_PREFIX}/huong`)
                  const duongXemBanDo = pathOwnStage
                    ? duongDanChangLoTrinh(path, pathOwnStage)
                    : (duongDanHuongTheoChangId(ref.stageId) ?? `${PROGRAMMING_PREFIX}/huong`)
                  return (
                    <li
                      key={ref.stageId}
                      className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-white leading-snug">
                          {stage?.name ?? ref.stageId}
                          {xong && (
                            <CheckCircle2
                              className="inline-block w-4 h-4 text-emerald-400 theme-light:text-emerald-900 ml-1.5 align-text-bottom"
                              aria-label="Đã xong"
                            />
                          )}
                          {mien && (
                            <Sparkles
                              className="inline-block w-4 h-4 text-accent-400 ml-1.5 align-text-bottom"
                              aria-label="Được đề xuất miễn từ chẩn đoán"
                            />
                          )}
                        </p>
                        <span className="text-[11px] font-semibold text-zinc-400 shrink-0">
                          {ref.stageId.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{ref.why}</p>
                      {coBai ? (
                        <button
                          onClick={() => nav(duongVaoHoc)}
                          className="tap-44 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-xs transition active:scale-[0.98]"
                        >
                          <Play className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Vào học chặng này</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => nav(duongXemBanDo)}
                          className="tap-44 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-accent-500/60 text-zinc-200 font-semibold text-xs transition active:scale-[0.98]"
                        >
                          <Map className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
                          <span>Xem bản đồ chặng (bài đang soạn)</span>
                        </button>
                      )}
                      {user &&
                        (stageHasQuiz(ref.stageId) ? (
                          <PathStageQuiz
                            pathId={path.id}
                            stageId={ref.stageId}
                            stageName={stage?.name ?? ref.stageId}
                            topics={stage?.modules.flatMap((m) => m.topics) ?? []}
                            onPassed={reloadPathProgress}
                          />
                        ) : (
                          <p className="text-[11px] text-zinc-500">Chặng này chưa có bài kiểm.</p>
                        ))}
                    </li>
                  )
                })}
              </ol>
            )}

            <p className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
              <Award className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong className="text-zinc-200">Bằng chứng chốt giai đoạn:</strong>{' '}
                {phase.artifact.name} — {phase.artifact.brief}
              </span>
            </p>
          </section>
        ))}

        {user && (
          <PathArtifactVault
            pathId={path.id}
            phases={path.phases
              .filter((p) => !isPhaseDrafting(p))
              .map((p) => ({ id: p.id, name: p.name }))}
          />
        )}

        {/* Đích đến — hành vi quan sát được, không phải danh xưng */}
        <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-2">
          <h2 className="text-base font-bold text-white">Đi hết lộ trình, bạn là người:</h2>
          <ul className="text-sm text-zinc-100 leading-relaxed space-y-1.5 list-disc pl-5">
            {path.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </section>
      </PageShell>
    </div>
  )
}
