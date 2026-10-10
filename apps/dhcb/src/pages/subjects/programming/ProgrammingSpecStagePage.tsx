// ProgrammingSpecStagePage — MỘT CHẶNG của hướng chuyên sâu (`/lap-trinh/huong/:specId/:stageId`).
//
// Trang chi tiết hướng trả lời "đi thế nào"; trang này trả lời hai câu tiếp theo mà bản đồ
// không trả lời được:
//   ① "module này học xong tôi LÀM ĐƯỢC gì, làm sao biết đã nắm?" → mục tiêu · luyện tay ·
//      tự kiểm · dấu hiệu đã nắm (dữ liệu ở specializations/details/).
//   ② "dự án chặng coi là XONG khi nào?"                          → rubric có cách chứng minh
//      + đặc tả mẫu 6 ô để viết trước khi làm.
//
// Chặng CHƯA soạn chi tiết (đợt đầu chỉ có S2) vẫn mở được: hiện phần bản đồ sẵn có kèm ghi
// chú đang soạn — KHÔNG bịa nội dung, cũng không trả trang lỗi.
//
// Tiến độ: mỗi module và mỗi tiêu chí rubric là một mục đánh dấu được, lưu qua
// /api/programming/progress (khoá 'web-s2-m1' / 'web-s2-r3') — cùng bảng với bài học P1–P6.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@core/PageShell'
import { LessonAnimation } from '@core/LessonAnimation'
import {
  Check,
  ClipboardCheck,
  Clock,
  FileSignature,
  ListChecks,
  Target,
  Trophy,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../context/useAuth'
import {
  fetchProgress,
  saveLessonProgress,
  type ProgrammingLessonProgress,
} from '../../../lib/programmingProgress'
import { getSpecialization } from '@dhcb/subject-programming/specializations/registry'
import { buildSlugSegment, idFromSlugSegment } from '@core/slug'
import {
  PROGRAMMING_PREFIX,
  duongDanChangHuong,
  duongDanHuong,
} from '../../../lib/programmingRoutes'
import type {
  SpecBrief,
  SpecModuleDetail,
  SpecStageDetail,
} from '@dhcb/subject-programming/specializations/stageDetails'
import { loadSpecStageDetail } from '@dhcb/subject-programming/specializations/stageDetailsLoader'
import { usePageTitle } from '../../../lib/usePageTitle'
import { buttonClass } from '@core/buttonStyles'

/** Ô đánh dấu xong một mục tiến độ. Đã xong thì KHÔNG bỏ được — cùng bất biến với server. */
function DoneToggle({ done, label, onDone }: { done: boolean; label: string; onDone: () => void }) {
  return (
    <button
      type="button"
      onClick={done ? undefined : onDone}
      aria-pressed={done}
      aria-label={done ? `Đã xong: ${label}` : `Đánh dấu đã xong: ${label}`}
      disabled={done}
      className={`tap-44 shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition ${
        done
          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900'
          : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-accent-500 hover:text-accent-400'
      }`}
    >
      <Check className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}

function ModuleBlock({
  index,
  title,
  topics,
  detail,
  done,
  onDone,
}: {
  index: number
  title: string
  topics: string[]
  detail?: SpecModuleDetail
  done: boolean
  onDone: () => void
}) {
  return (
    <li className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1.5">
          <h3 className="text-sm font-bold text-white">
            {index}. {title}
          </h3>
          {detail && (
            <p className="text-sm text-zinc-200 leading-relaxed">
              <span className="font-semibold">Học xong làm được:</span> {detail.objective}
            </p>
          )}
        </div>
        <DoneToggle done={done} label={title} onDone={onDone} />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-zinc-200">Kiến thức</p>
        <ul className="text-sm text-zinc-200 leading-relaxed space-y-1 list-disc pl-5">
          {topics.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      {detail && (
        <>
          {/* [GĐ2 hoạt ảnh, 2026-09-22] Hình động minh hoạ CƠ CHẾ đặt ngay sau phần kiến thức và
              TRƯỚC bài luyện tay: thấy thuật toán chạy rồi mới tự tay viết. Renderer dùng chung
              với 4 môn STEM — tự lo prefers-reduced-motion + mô tả bằng lời. */}
          {detail.animation && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-200">Hoạt ảnh minh hoạ</p>
              <LessonAnimation
                spec={detail.animation}
                // `[&_svg]:max-w-2xl`: viewBox hoạt ảnh nhỏ (≈440×180) — để `w-full` ở cột 4xl thì ô số
                // phình gần gấp ba, chữ mô tả bên dưới trông lép (thấy ở ảnh 1440px, Tầng 8b).
                className="rounded-xl border border-line-subtle bg-surface-card p-3 text-sm leading-relaxed [&_svg]:mx-auto [&_svg]:max-w-2xl"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-200">Tự tay làm</p>
            <ul className="text-sm text-zinc-200 leading-relaxed space-y-1 list-disc pl-5">
              {detail.practice.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          <details className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
            <summary className="tap-44 text-sm font-semibold text-zinc-100 cursor-pointer">
              Tự kiểm ({detail.selfCheck.length} câu)
            </summary>
            <ul className="mt-2 space-y-2">
              {detail.selfCheck.map((c) => (
                <li key={c.q} className="space-y-1">
                  <p className="text-sm text-zinc-100 font-semibold leading-relaxed">{c.q}</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{c.a}</p>
                </li>
              ))}
            </ul>
          </details>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-200">Dấu hiệu đã nắm</p>
            <ul className="text-sm text-zinc-200 leading-relaxed space-y-1 list-disc pl-5">
              {detail.doneSignals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </li>
  )
}

/** Đặc tả mẫu 6 ô — thứ phải viết TRƯỚC khi bắt tay vào dự án chặng. */
function BriefBlock({ brief }: { brief: SpecBrief }) {
  const boxes: { title: string; hint: string; items: string[] }[] = [
    {
      title: 'Phạm vi — LÀM',
      hint: 'Việc quan sát được, không nói chung chung.',
      items: brief.scopeDo,
    },
    {
      title: 'Phạm vi — KHÔNG làm',
      hint: 'Ô quan trọng ngang ô trên: nó giữ cho dự án không phình.',
      items: brief.scopeDont,
    },
    { title: 'Điểm chạm', hint: 'Chỗ nào trong mã sẽ bị đụng tới.', items: brief.touchpoints },
    {
      title: 'Hợp đồng',
      hint: 'Cái gì đi qua ranh giới và ràng buộc phải giữ.',
      items: brief.contracts,
    },
    { title: 'Tiêu chí chấp nhận', hint: 'Đo được, kèm cách chứng minh.', items: brief.acceptance },
    {
      title: 'Bất biến',
      hint: 'Điều luôn đúng bất kể thao tác nào — phải có test canh.',
      items: brief.invariants,
    },
    {
      title: 'Quy ước',
      hint: 'Bên thi hành không thấy hội thoại trước đó.',
      items: brief.conventions,
    },
  ]
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-accent-400" aria-hidden="true" />
        <span>Đặc tả mẫu cho dự án chặng</span>
      </h2>
      <p className="text-sm text-zinc-200 leading-relaxed">
        Viết đủ sáu ô này TRƯỚC khi gõ dòng mã đầu tiên. Đây cũng là khuôn bạn dùng khi giao việc
        cho người khác hoặc cho AI thi hành.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {boxes.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2"
          >
            <h3 className="text-sm font-bold text-white">{b.title}</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{b.hint}</p>
            <ul className="text-sm text-zinc-200 leading-relaxed space-y-1 list-disc pl-5">
              {b.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

type DetailState =
  | { status: 'ready'; stageId: string; detail: SpecStageDetail | undefined }
  | { status: 'error'; stageId: string }

/**
 * Nạp lười chi tiết MỘT chặng (audit 2026-10-10, đợt E4): trước đây trang import cả 56 chặng
 * (chunk ~540 KB). Trạng thái "đang tải" được SUY RA (kết quả đang giữ là của chặng khác) thay
 * vì setState đồng bộ trong effect.
 */
function useStageDetail(stageId: string | undefined) {
  const [state, setState] = useState<DetailState | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!stageId) return
    let alive = true
    loadSpecStageDetail(stageId).then(
      (detail) => {
        if (alive) setState({ status: 'ready', stageId, detail })
      },
      (err: unknown) => {
        console.warn('[spec-stage] không tải được chi tiết chặng:', err)
        if (alive) setState({ status: 'error', stageId })
      },
    )
    return () => {
      alive = false
    }
  }, [stageId, attempt])

  const current = state && state.stageId === stageId ? state : null
  return {
    loading: !!stageId && current === null,
    failed: current?.status === 'error',
    detail: current?.status === 'ready' ? current.detail : undefined,
    retry: () => {
      setState(null)
      setAttempt((n) => n + 1)
    },
  }
}

export default function ProgrammingSpecStagePage() {
  const nav = useNavigate()
  const { user } = useAuth()
  // Cả hai đoạn URL đều mang dạng `<mã>--<tên đã slug hoá>`; mã đứng đầu nên link cũ vẫn tra
  // ra đúng chặng rồi được chuyển hướng về URL chuẩn.
  const { specId: specSlugParam, stageId: stageSlugParam } = useParams<{
    specId: string
    stageId: string
  }>()
  const spec = getSpecialization(idFromSlugSegment(specSlugParam ?? ''))
  const stage = spec?.stages.find(
    (s) =>
      s.id ===
      idFromSlugSegment(stageSlugParam ?? '')
        .trim()
        .toLowerCase(),
  )
  usePageTitle(`${stage && spec ? `${stage.name} — ${spec.name}` : 'Chặng học'} | Môn Lập trình`)
  const { detail, loading: detailLoading, failed: detailFailed, retry } = useStageDetail(stage?.id)

  const [progress, setProgress] = useState<ProgrammingLessonProgress[]>([])

  useEffect(() => {
    if (!user) return
    let alive = true
    void fetchProgress(user.id).then((rows) => {
      if (alive) setProgress(rows)
    })
    return () => {
      alive = false
    }
  }, [user])

  const doneIds = useMemo(
    () => new Set(progress.filter((p) => p.status === 'completed').map((p) => p.lessonId)),
    [progress],
  )

  const markDone = useCallback(
    (id: string) => {
      // Cập nhật lạc quan: mất mạng vẫn thấy đã tick, server là nguồn sự thật khi quay lại.
      setProgress((rows) =>
        rows.some((r) => r.lessonId === id)
          ? rows.map((r) => (r.lessonId === id ? { ...r, status: 'completed' as const } : r))
          : [...rows, { lessonId: id, status: 'completed' as const, completedAt: Date.now() }],
      )
      if (user) void saveLessonProgress(user.id, id, 'completed')
    },
    [user],
  )

  if (!spec || !stage) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Layout title="Không có chặng này" onBack={() => nav(`${PROGRAMMING_PREFIX}/huong`)} />
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] */}
        <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-4">
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            Không có chặng này
          </h1>
          <button
            onClick={() => nav(`${PROGRAMMING_PREFIX}/huong`)}
            className={buttonClass({ size: 'lg', fullWidth: true })}
          >
            Xem các hướng chuyên sâu
          </button>
        </PageShell>
      </div>
    )
  }

  // Link cũ (chỉ mã) hoặc tên hướng/chặng đã đổi → về URL chuẩn.
  const canonicalSpec = buildSlugSegment(spec.id, spec.name)
  const canonicalStage = buildSlugSegment(stage.id, stage.name)
  if (specSlugParam !== canonicalSpec || stageSlugParam !== canonicalStage) {
    return <Navigate to={duongDanChangHuong(spec, stage)} replace />
  }

  const totalItems = stage.modules.length + (detail?.rubric.length ?? 0)
  const doneCount =
    stage.modules.filter((m) => doneIds.has(m.id)).length +
    (detail?.rubric.filter((r) => doneIds.has(r.id)).length ?? 0)
  const percent = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100)

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* Breadcrumb: thêm đốt cha ĐỘNG là chính hướng chuyên sâu này (cây route tĩnh
          chỉ biết tới tầng "Hướng chuyên sâu"). */}
      <Layout
        title={stage.name}
        onBack={() => nav(duongDanHuong(spec))}
        crumbs={[{ label: spec.name, to: duongDanHuong(spec) }]}
      />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {stage.name}
        </h1>

        <section className="rounded-3xl border border-accent-500/40 bg-zinc-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Học xong chặng này làm được</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed">{stage.canDo}</p>
          <p className="text-xs text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{stage.duration}</span>
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed">
            <span className="font-semibold">Đã đánh dấu xong:</span>{' '}
            {detailLoading ? 'đang tải…' : `${doneCount}/${totalItems} mục (${percent}%)`}
          </p>
        </section>

        {detailLoading && (
          <p
            role="status"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-200 leading-relaxed"
          >
            Đang tải chi tiết chặng…
          </p>
        )}

        {detailFailed && (
          <div
            role="alert"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3 text-sm text-zinc-200 leading-relaxed"
          >
            <p>Không tải được chi tiết chặng — kiểm tra kết nối mạng rồi thử lại.</p>
            <button type="button" onClick={retry} className={buttonClass({ size: 'md' })}>
              Thử lại
            </button>
          </div>
        )}

        {!detailLoading && !detailFailed && !detail && (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-200 leading-relaxed">
            Chặng này mới có bản đồ (module và dự án). Phần chi tiết — bài luyện tay, câu tự kiểm và
            tiêu chí nghiệm thu — đang được soạn ở đợt sau; hiện tại chặng S2 của mọi hướng đã có
            đủ.
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Module của chặng</span>
          </h2>
          <ol className="space-y-3">
            {stage.modules.map((m, i) => (
              <ModuleBlock
                key={m.id}
                index={i + 1}
                title={m.title}
                topics={m.topics}
                detail={detail?.modules.find((d) => d.moduleId === m.id)}
                done={doneIds.has(m.id)}
                onDone={() => markDone(m.id)}
              />
            ))}
          </ol>
        </section>

        <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Dự án: {stage.project.name}</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed">{stage.project.brief}</p>

          {detail ? (
            <>
              <p className="text-xs font-semibold text-zinc-200">
                Nghiệm thu — mỗi dòng phải chứng minh được
              </p>
              <ul className="space-y-2">
                {detail.rubric.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex items-start gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-zinc-100 font-semibold leading-relaxed">
                        {r.text}
                      </p>
                      <p className="text-sm text-zinc-200 leading-relaxed flex items-start gap-1.5">
                        <ClipboardCheck
                          className="w-4 h-4 text-accent-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-semibold">Chứng minh:</span> {r.howToProve}
                        </span>
                      </p>
                    </div>
                    <DoneToggle
                      done={doneIds.has(r.id)}
                      label={r.text}
                      onDone={() => markDone(r.id)}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ul className="text-sm text-zinc-200 leading-relaxed space-y-1 list-disc pl-5">
              {stage.project.requirements.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          )}
        </section>

        {detail && <BriefBlock brief={detail.specBrief} />}
      </PageShell>
    </div>
  )
}
