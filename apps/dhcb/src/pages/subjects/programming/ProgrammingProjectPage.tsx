// ProgrammingProjectPage — DỰ ÁN TRỤC T1 "Cửa hàng của tôi" (PR-L3b; P2 ở PR-L6b, P3 ở PR-L8).
// Học viên xây cửa hàng của mình lớn dần qua các CHẶNG (P1 "Máy tính tiền" → P2 "Sổ sách tử
// tế" → P3 "Lên web"); mỗi chặng 5 bước, mỗi bước có milestone check chấm HÀNH VI — đạt hết
// mở bước sau; bước cuối chặng chốt snapshot.
// Chặng P2 làm việc với NHIỀU FILE (giao diện / logic / lưu trữ) nên trang có thanh file.
// Chặng P3 mỗi bước MỘT NGÔN NGỮ (html → CSS → dom → sql → fetch): bộ chạy do `language` của
// bước quyết định qua runLessonCode — y hệt trang bài học, nên hai nơi không chấm lệch nhau.
// Workspace bền server (lib/programmingProject), tiến độ bước dùng chung bảng tiến độ bài học.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import { PageShell } from '@core/PageShell'
import {
  Store,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  Save,
  Trophy,
  Lock,
  FileCode,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import { PROGRAMMING_PREFIX } from '../../../lib/programmingRoutes'
import CodeEditor from '../../../components/CodeEditor'
import { useAuth } from '../../../context/useAuth'
import { runLessonCode, resetLessonRunners } from '../../../lib/codeRunner'
import { HtmlPreview } from '../../../components/HtmlPreview'
// fetchGia chứ KHÔNG phải fetchPrelude: prelude kéo theo linkedom (~94KB gzip), thư viện đó
// chỉ được sống trong worker (xem ghi chú cùng nội dung ở ProgrammingLessonPage).
import { FETCH_SHIM_CUA_HANG_JS } from '@dhcb/subject-programming/fetchGia'
import {
  loadProjectFiles,
  saveProjectFileAt,
  snapshotMilestone,
} from '../../../lib/programmingProject'
import {
  fetchProgress,
  saveLessonProgress,
  isLessonCompleted,
} from '../../../lib/programmingProgress'
import {
  PROJECT_STAGES,
  getStepFiles,
  getStepMainFile,
  getStepLanguage,
} from '@dhcb/subject-programming/projectSteps'
import {
  gradeTestCase,
  allTestsPassed,
  type TestCaseResult,
} from '@dhcb/subject-programming/grading'

/** Chặng nào cũng phải xong TOÀN BỘ chặng trước mới mở (dự án tiến hoá, không nhảy cóc). */
function isStageUnlocked(index: number, done: Set<string>): boolean {
  return PROJECT_STAGES.slice(0, index).every((st) => st.steps.every((s) => done.has(s.id)))
}

export default function ProgrammingProjectPage() {
  usePageTitle('Dự án trục | Môn Lập trình · Đồng Hành Cùng Bạn')
  const nav = useNavigate()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [files, setFiles] = useState<Record<string, string> | null>(null) // null = đang tải
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [savingNow, setSavingNow] = useState(false)
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set())
  const [activeStepId, setActiveStepId] = useState(PROJECT_STAGES[0]!.steps[0]!.id)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [results, setResults] = useState<TestCaseResult[] | null>(null)
  const [hintShown, setHintShown] = useState(false)
  const [refViewed, setRefViewed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  // Bước web của chặng P3: bản chụp code để xem trang chạy (null = chưa bấm xem lần nào).
  // Bước 'dom'/'fetch' KHÔNG xem theo từng phím gõ — script dở dang sẽ chạy ngay trong khung.
  const [previewScript, setPreviewScript] = useState<string | null>(null)
  // Bản chụp tiến độ dùng để ĐẶT bước ban đầu. Cố ý KHÔNG đưa doneSteps vào deps của effect
  // bên dưới: chấm đạt một bước sẽ đổi doneSteps, mà nhảy bước ngay lúc đó thì cuốn mất
  // bảng kết quả xanh và nút "Sang bước tiếp" — trái nhịp thong thả đã chốt ở PR-L3b.
  const doneRef = useRef<Set<string>>(new Set())

  // Chặng đang xem nằm trong query ?chang= để chia sẻ/bookmark đúng chặng.
  const stageIndex = Math.max(
    0,
    PROJECT_STAGES.findIndex((s) => s.level === (params.get('chang') ?? 'p1')),
  )
  const stage = PROJECT_STAGES[stageIndex]!
  const steps = stage.steps

  // Nạp workspace + tiến độ bước; đặt bước hiện tại = bước đầu tiên CHƯA xong của chặng.
  useEffect(() => {
    if (!user) return
    void Promise.all([loadProjectFiles(user.id), fetchProgress(user.id)]).then(
      ([workspace, progress]) => {
        setFiles(workspace)
        const done = new Set(
          PROJECT_STAGES.flatMap((st) => st.steps)
            .filter((s) => isLessonCompleted(progress, s.id))
            .map((s) => s.id),
        )
        doneRef.current = done
        setDoneSteps(done)
        setLoaded(true)
      },
    )
    return () => resetLessonRunners()
  }, [user])

  // Đổi chặng (hoặc nạp xong tiến độ) → nhảy tới bước đầu tiên chưa xong của chặng đó.
  useEffect(() => {
    const firstOpen = steps.find((s) => !doneRef.current.has(s.id))
    setActiveStepId(firstOpen?.id ?? steps.at(-1)!.id)
    setResults(null)
    setHintShown(false)
    setRefViewed(false)
    setPreviewScript(null)
  }, [stageIndex, loaded, steps])

  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === activeStepId),
  )
  const activeStep = steps[activeIndex]!
  const stepFiles = useMemo(() => getStepFiles(activeStep), [activeStep])
  const mainFile = getStepMainFile(activeStep)
  const stepLanguage = getStepLanguage(activeStep)
  // File đang soạn phải thuộc bước hiện tại — đổi bước thì quay về file chính.
  // (Thanh file dựng bằng nav + aria-current chứ KHÔNG dùng role="tablist"/"tab": vai trò
  //  tab kéo theo hợp đồng bàn phím mũi tên trái/phải mà ta chưa cài — khai mà không làm
  //  đúng thì hại người dùng bàn phím hơn là giúp.)
  const shownFile = activeFile && stepFiles.includes(activeFile) ? activeFile : mainFile
  const stageDone = steps.every((s) => doneSteps.has(s.id))

  // Bước được MỞ khi mọi bước trước nó trong chặng đã xong.
  const isUnlocked = (i: number) => steps.slice(0, i).every((s) => doneSteps.has(s.id))

  const onCodeChange = (next: string) => {
    setFiles((prev) => ({ ...(prev ?? {}), [shownFile]: next }))
    setDirty((prev) => new Set(prev).add(shownFile))
  }

  /** Lưu mọi file đang bẩn (bấm "Xem code mẫu" có thể làm bẩn nhiều file cùng lúc). */
  const doSave = async (): Promise<void> => {
    if (!user || files === null || dirty.size === 0) return
    setSavingNow(true)
    for (const path of dirty) {
      await saveProjectFileAt(user.id, path, files[path] ?? '')
    }
    setDirty(new Set())
    setSavingNow(false)
  }

  const runChecks = async () => {
    if (checking || !user || files === null) return
    setChecking(true)
    setResults(null)
    await doSave() // luôn lưu trước khi chấm — không chấm bản chưa lưu
    // Bước nhiều file: bộ chấm chạy `probeCode` (import module của học viên) thay cho file
    // chính — chỉ chạy file chính thì code gộp một file vẫn cho output y hệt, không ép
    // được việc tách vai trò.
    const entry = activeStep.probeCode ?? files[mainFile] ?? ''
    const workspace = Object.fromEntries(
      stepFiles.map((path) => [path, files[path] ?? '']),
    ) as Record<string, string>
    const out: TestCaseResult[] = []
    for (const check of activeStep.checks) {
      // Bộ chạy do `language` của bước quyết định (chặng P3 mỗi bước một ngôn ngữ) — đi qua
      // runLessonCode y như bài học, nên bước dự án và bài học không thể chấm lệch nhau.
      const r = await runLessonCode(getStepLanguage(activeStep), entry, {
        stdinLines: check.stdinLines,
        files: workspace,
        ...(activeStep.domHtml ? { domHtml: activeStep.domHtml } : {}),
        // Bước fetch của DỰ ÁN gọi API menu của chính cửa hàng, không phải API thời tiết
        // của bài học P3-U7.
        fetchApi: 'cua-hang',
      })
      out.push(
        gradeTestCase(check, r.output, r.error ?? (r.timedOut ? 'Quá thời gian' : undefined)),
      )
      setResults([...out])
    }
    setChecking(false)
    if (allTestsPassed(out)) {
      const nextDone = new Set(doneSteps).add(activeStep.id)
      doneRef.current = nextDone
      setDoneSteps(nextDone)
      void saveLessonProgress(user.id, activeStep.id, 'completed')
      if (activeStep.isMilestone) void snapshotMilestone(stage.level)
      // KHÔNG tự nhảy bước: giữ nguyên các ca xanh cho học viên thấy thành quả,
      // banner bên dưới hiện nút "Sang bước tiếp" (đúng nhịp thong thả của Companion).
    }
  }

  /** "Phao": nạp code tham chiếu của bước (kể cả các file phụ) — không phạt, chỉ ghi nhận. */
  const loadReference = () => {
    setRefViewed(true)
    setFiles((prev) => ({
      ...(prev ?? {}),
      ...(activeStep.referenceFiles ?? {}),
      [mainFile]: activeStep.referenceCode,
    }))
    setDirty((prev) => {
      const next = new Set(prev).add(mainFile)
      for (const path of Object.keys(activeStep.referenceFiles ?? {})) next.add(path)
      return next
    })
  }

  const saveLabel = savingNow ? 'Đang lưu…' : dirty.size > 0 ? 'Chưa lưu' : 'Đã lưu'

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout onBack={() => nav(PROGRAMMING_PREFIX)} title="Dự án: Cửa hàng của tôi" />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-5">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Dự án: Cửa hàng của tôi
        </h1>

        {/* Thanh chọn chặng */}
        <nav aria-label="Các chặng dự án" className="flex gap-2 flex-wrap">
          {PROJECT_STAGES.map((st, i) => {
            const unlocked = isStageUnlocked(i, doneSteps)
            return (
              <button
                key={st.level}
                disabled={!unlocked}
                onClick={() => setParams({ chang: st.level }, { replace: true })}
                aria-current={i === stageIndex ? 'page' : undefined}
                className={`tap-44 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition ${
                  i === stageIndex
                    ? 'bg-accent-500 text-black'
                    : unlocked
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                      : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500'
                }`}
              >
                {unlocked ? <Store className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{st.title}</span>
              </button>
            )
          })}
        </nav>
        {!isStageUnlocked(stageIndex, doneSteps) && (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-sm text-zinc-300">
            Chặng này mở khi bạn hoàn thành trọn chặng trước — cửa hàng phải có máy tính tiền chạy
            được thì mới nói chuyện sổ sách được.
          </p>
        )}

        {/* Thanh bước dự án */}
        <nav aria-label="Các bước dự án" className="flex gap-1.5 overflow-x-auto pb-1">
          {steps.map((s, i) => {
            const unlocked = isUnlocked(i)
            return (
              <button
                key={s.id}
                disabled={!unlocked}
                onClick={() => {
                  setActiveStepId(s.id)
                  setResults(null)
                  setHintShown(false)
                  setRefViewed(false)
                  setPreviewScript(null)
                }}
                aria-current={s.id === activeStepId ? 'step' : undefined}
                className={`tap-44 shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  s.id === activeStepId
                    ? 'bg-accent-500 text-black'
                    : unlocked
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                      : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500'
                }`}
              >
                {doneSteps.has(s.id) ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : unlocked ? (
                  <Store className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>Bước {i + 1}</span>
              </button>
            )
          })}
        </nav>

        {/* Yêu cầu bước hiện tại */}
        <section className="bg-zinc-900/80 border border-accent-500/30 rounded-3xl p-5 space-y-2">
          <h2 className="text-sm font-bold text-white">
            Bước {activeIndex + 1}: {activeStep.title}
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
            {activeStep.requirement}
          </p>
        </section>

        {/* Editor workspace */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {stepFiles.length > 1 ? (
              <nav aria-label="File của dự án" className="flex gap-1.5 overflow-x-auto">
                {stepFiles.map((path) => (
                  <button
                    key={path}
                    aria-current={path === shownFile ? 'page' : undefined}
                    onClick={() => setActiveFile(path)}
                    className={`tap-44 shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition ${
                      path === shownFile
                        ? 'bg-accent-500 text-black'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{path}</span>
                  </button>
                ))}
              </nav>
            ) : (
              <h2 className="text-sm font-bold text-white font-mono">{shownFile}</h2>
            )}
            <span className="text-xs text-zinc-400">{saveLabel}</span>
          </div>
          {files === null ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-6 text-sm text-zinc-400">
              Đang tải workspace của bạn…
            </div>
          ) : (
            <CodeEditor
              value={files[shownFile] ?? ''}
              onChange={onCodeChange}
              ariaLabel={`File dự án ${shownFile}`}
            />
          )}

          {/* Bước HTML/CSS: thấy ngay trang mình đang viết — thứ khiến người mới bám trụ được
              với web. Trang tĩnh nên xem theo từng lần gõ được (script bị tắt trong khung). */}
          {files !== null && stepLanguage === 'html' && (
            <HtmlPreview html={files[shownFile] ?? ''} />
          )}

          {/* Bước DOM/fetch: chỉ chạy khi BẤM — script dở dang (vòng lặp vô hạn đang gõ nửa
              chừng) mà tự chạy là tự bắn vào chân. Bước fetch nhúng thêm fetch giả của API
              cửa hàng, vì khung xem trang không có mạng thật. */}
          {files !== null && activeStep.domHtml && (
            <div className="space-y-2">
              <button
                onClick={() =>
                  setPreviewScript(
                    (stepLanguage === 'fetch' ? FETCH_SHIM_CUA_HANG_JS : '') +
                      (files[shownFile] ?? ''),
                  )
                }
                className="tap-44 inline-flex items-center px-4 py-2 rounded-2xl border border-zinc-700 hover:border-zinc-500 text-sm text-zinc-200 transition"
              >
                Xem trang chạy
              </button>
              {previewScript !== null && (
                <HtmlPreview html={activeStep.domHtml} script={previewScript} />
              )}
            </div>
          )}
        </section>

        {/* Hành động */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void runChecks()}
            disabled={checking || files === null}
            className="tap-44 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-sm transition"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{checking ? 'Đang kiểm tra…' : 'Kiểm tra bước'}</span>
          </button>
          <button
            onClick={() => void doSave()}
            disabled={dirty.size === 0 || savingNow}
            className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 disabled:opacity-50 text-zinc-200 font-semibold text-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Lưu</span>
          </button>
          {!hintShown && (
            <button
              onClick={() => setHintShown(true)}
              className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 font-semibold text-sm transition"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
              <span>Gợi ý</span>
            </button>
          )}
          {!refViewed && (
            <button
              onClick={loadReference}
              className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-semibold text-sm transition"
            >
              <Eye className="w-4 h-4" />
              <span>Xem code mẫu bước này</span>
            </button>
          )}
        </div>
        {hintShown && (
          <p className="flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-zinc-100">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-400 theme-light:text-amber-900" />
            <span>{activeStep.hint}</span>
          </p>
        )}

        {/* Kết quả milestone check */}
        {results && (
          <ul className="space-y-2" aria-live="polite">
            {results.map((r, i) => (
              <li
                key={i}
                className={`rounded-2xl border p-3.5 text-sm ${
                  r.passed
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-rose-500/30 bg-rose-500/10'
                }`}
              >
                <p className="flex items-center gap-2 font-semibold text-zinc-100">
                  {r.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 theme-light:text-rose-900" />
                  )}
                  <span>{r.hidden ? `Ca ẩn ${i + 1}` : r.label}</span>
                </p>
                {r.error && (
                  <pre className="mt-2 text-xs font-mono text-zinc-200 whitespace-pre-wrap">
                    {r.error}
                  </pre>
                )}
                {!r.passed && r.actual !== undefined && !r.error && (
                  <p className="mt-2 text-xs text-zinc-200">
                    Máy của bạn in ra:{' '}
                    <code className="font-mono">{r.actual || '(không in gì)'}</code>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {results && allTestsPassed(results) && !activeStep.isMilestone && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-zinc-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="font-semibold">Đạt hết test của bước {activeIndex + 1}! 🎉</p>
            <button
              onClick={() => {
                const next = steps[activeIndex + 1]
                if (next) {
                  setActiveStepId(next.id)
                  setResults(null)
                  setHintShown(false)
                  setRefViewed(false)
                  setPreviewScript(null)
                  setPreviewScript(null)
                }
              }}
              className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition"
            >
              Sang bước {activeIndex + 2}
            </button>
          </div>
        )}

        {stageDone && (
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm text-zinc-100 flex items-start gap-3">
            <Trophy className="w-6 h-6 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
            <div>
              <p className="font-bold">Hoàn thành {stage.title}! 🎉</p>
              <p className="mt-1 leading-relaxed">
                Bản cửa hàng của bạn đã được chốt snapshot milestone {stage.level.toUpperCase()} —
                sau này nhìn lại sẽ thấy mình đi xa cỡ nào.{' '}
                {stageIndex + 1 < PROJECT_STAGES.length
                  ? `Chặng tiếp theo (${PROJECT_STAGES[stageIndex + 1]!.title}) đã mở ở thanh trên.`
                  : 'Chặng tiếp theo sẽ mở cùng nội dung bậc sau.'}
              </p>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  )
}
