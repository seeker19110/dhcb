// ProgrammingPathStagePage — MỘT CHẶNG RIÊNG của lộ trình mục tiêu
// (`/lap-trinh/lo-trinh/:pathId/chang/:stageId`, đợt 4 — giai đoạn P5 "Tầm trưởng").
//
// Khác `ProgrammingSpecStagePage` (chặng của một HƯỚNG chuyên sâu): chặng ở đây (principal-s1
// …s4) không thuộc sổ 14 hướng — dữ liệu sống trong `learningPaths/pathStages.ts`. Trang này
// chỉ hiện đúng những gì đợt 4 cần: tên/can-do/module/dự án của chặng, danh sách bài học 8
// bước theo unit (link sang trang bài sẵn có), và quiz cổng của lộ trình. Đặc tả:
// `docs/specs/2026-08-31-dot-4-p5-tam-truong.md`.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, CheckCircle2, Play, Target, Trophy } from 'lucide-react'
import Layout from '../../../components/Layout'
import LangBadge from '../../../components/programming/LangBadge'
import { PageShell } from '@core/PageShell'
import { useAuth } from '../../../context/useAuth'
import {
  fetchProgress,
  isLessonCompleted,
  type ProgrammingLessonProgress,
} from '../../../lib/programmingProgress'
import { idFromSlugSegment } from '@core/slug'
import {
  PROGRAMMING_PREFIX,
  duongDanBaiHoc,
  duongDanChangLoTrinh,
  duongDanLoTrinh,
} from '../../../lib/programmingRoutes'
import { getLearningPath } from '@dhcb/subject-programming/learningPaths/registry'
import { getPathStage } from '@dhcb/subject-programming/learningPaths/pathStages'
import { unitsOfStage } from '@dhcb/subject-programming/specializations/stageUnits'
import { getUnitSummaries } from '@dhcb/subject-programming/lessonsLoader'
import { stageHasQuiz } from '@dhcb/subject-programming/learningPaths/stageQuizzes'
import PathStageQuiz from '../../../components/PathStageQuiz'

export default function ProgrammingPathStagePage() {
  const nav = useNavigate()
  const { user } = useAuth()
  // Cả hai đoạn URL mang dạng `<mã>--<tên đã slug hoá>`; mã đứng đầu nên link cũ vẫn tra ra.
  const { pathId: pathSlugParam, stageId: stageSlugParam } = useParams<{
    pathId: string
    stageId: string
  }>()
  const pathId = pathSlugParam ? idFromSlugSegment(pathSlugParam) : undefined
  const stageId = stageSlugParam ? idFromSlugSegment(stageSlugParam) : undefined
  const [progress, setProgress] = useState<ProgrammingLessonProgress[]>([])

  useEffect(() => {
    if (!user) return
    void fetchProgress(user.id).then(setProgress)
  }, [user])

  const path = pathId ? getLearningPath(pathId) : undefined
  const stage = stageId ? getPathStage(stageId) : undefined

  // Lộ trình lạ, chặng lạ, hoặc chặng không thuộc lộ trình → về trang lộ trình, không trang rỗng.
  if (!path || !stage)
    return (
      <Navigate
        to={pathId ? `${PROGRAMMING_PREFIX}/lo-trinh/${pathId}` : PROGRAMMING_PREFIX}
        replace
      />
    )

  // Link cũ (chỉ mã) hoặc tên đã đổi → về URL chuẩn.
  const canonicalStage = duongDanChangLoTrinh(path, stage)
  if (
    `${PROGRAMMING_PREFIX}/lo-trinh/${pathSlugParam}/chang/${stageSlugParam}` !== canonicalStage
  ) {
    return <Navigate to={canonicalStage} replace />
  }

  const unitIds = unitsOfStage(stage.id)
  const stageLessons = unitIds.flatMap((u) => getUnitSummaries(u))
  const lessonCount = stageLessons.length
  const completedCount = stageLessons.filter((l) => isLessonCompleted(progress, l.id)).length

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* Breadcrumb: đốt cha động = lộ trình mục tiêu chứa chặng này. */}
      <Layout
        onBack={() => nav(duongDanLoTrinh(path))}
        crumbs={[{ label: path.title, to: duongDanLoTrinh(path) }]}
        title={stage.name}
      />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-5">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {stage.name}
        </h1>

        {lessonCount > 0 && (
          <div
            className="h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden"
            role="progressbar"
            aria-label={`Tiến độ chặng ${stage.id.toUpperCase()}`}
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={lessonCount}
          >
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round((completedCount / lessonCount) * 100)}%` }}
            />
          </div>
        )}

        {/* Bài học 8 bước, theo unit */}
        <section className="space-y-3">
          {unitIds.map((unitId, idx) => {
            const lessons = getUnitSummaries(unitId)
            return (
              <div
                key={unitId}
                className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-2.5"
              >
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent-400 shrink-0" aria-hidden="true" />
                  <span>Chương {idx + 1}</span>
                </p>
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="space-y-1.5">
                    <LangBadge language={lesson.language} />
                    <button
                      onClick={() => nav(duongDanBaiHoc(lesson))}
                      className="tap-44 w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 break-words">Học bài: {lesson.title}</span>
                      </span>
                      {isLessonCompleted(progress, lesson.id) && (
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </section>

        {/* Bản đồ module (tóm tắt để đối chiếu, không phải khu học chính) */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-400 shrink-0" aria-hidden="true" />
            <span>Kiến thức của chặng</span>
          </h2>
          {stage.modules.map((m) => (
            <div key={m.id} className="space-y-1">
              <p className="text-xs font-semibold text-zinc-200">{m.title}</p>
              <ul className="text-xs text-zinc-400 leading-relaxed list-disc pl-4 space-y-0.5">
                {m.topics.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Quiz cổng của lộ trình */}
        {user &&
          (stageHasQuiz(stage.id) ? (
            <PathStageQuiz
              pathId={path.id}
              stageId={stage.id}
              stageName={stage.name}
              topics={stage.modules.flatMap((m) => m.topics)}
            />
          ) : (
            <p className="text-[11px] text-zinc-500">Chặng này chưa có bài kiểm.</p>
          ))}

        {/* Dự án chốt chặng */}
        <section className="rounded-3xl border border-accent-500/40 bg-zinc-900 p-5 space-y-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent-400 shrink-0" aria-hidden="true" />
            <span>Dự án chốt chặng: {stage.project.name}</span>
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{stage.project.brief}</p>
          <ul className="text-xs text-zinc-300 leading-relaxed list-disc pl-5 space-y-1">
            {stage.project.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </PageShell>
    </div>
  )
}
