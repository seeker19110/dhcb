// ProgrammingCoursePage — trang một KHOÁ NGẮN (`/lap-trinh/khoa-hoc/:courseId`, PR 3/4 khoá Git;
// đổi tiền tố từ '/khoa/' sang '/khoa-hoc/' — xem changelog đổi route).
//
// Khác trang bậc (ProgrammingLevelPage): khoá KHÔNG có unit riêng, chỉ có CHƯƠNG, mỗi chương
// liệt kê bài trực tiếp qua `chapter.lessonIds` (tham chiếu — có thể là bài thuộc xương sống
// P1–P6, không nhất thiết bài "của riêng" khoá). Cố ý theo đúng bố cục ProgrammingLevelPage để
// người dùng thấy quen tay: tiêu đề + can-do → dải tiến độ → danh sách chương/bài.
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { BookOpen, CheckCircle2, FlaskConical, PackageCheck, Play } from 'lucide-react'
import Layout from '../../../components/Layout'
import LangBadge from '../../../components/programming/LangBadge'
import { isLessonCompleted } from '../../../lib/programmingProgress'
import { getShortCourse } from '@dhcb/subject-programming/courses/registry'
import { PageShell } from '@core/PageShell'
import { TwoPane } from '@core/TwoPane'
import { useIsDesktopViewport } from '../../../lib/useIsDesktopViewport'
import { getLessonSummary } from '@dhcb/subject-programming/lessonsLoader'
import { buildSlugSegment, idFromSlugSegment } from '@core/slug'
import { PROGRAMMING_PREFIX, duongDanBaiHoc } from '../../../lib/programmingRoutes'
import { buildCourseOutline } from '../../../lib/outline/programmingOutline'
import { useProgrammingOutlineCtx } from '../../../lib/useProgrammingOutlineCtx'
import { LoiTienDo } from '../../../components/OutlinePane'
import { useOutlinePane } from '../../../components/useOutlinePane'
import { usePageTitle } from '../../../lib/usePageTitle'

const TEN_MUC_LUC = 'Mục lục khoá học'

export default function ProgrammingCoursePage() {
  const nav = useNavigate()
  // URL là `<mã khoá>--<tiêu đề đã slug hoá>`; mã khoá đứng đầu nên link cũ (chỉ mã) vẫn tra
  // ra đúng khoá, rồi được chuyển hướng về URL chuẩn ngay bên dưới.
  const { courseId: courseSlugParam } = useParams<{ courseId: string }>()
  const course = courseSlugParam ? getShortCourse(idFromSlugSegment(courseSlugParam)) : undefined
  usePageTitle(`${course?.title ?? 'Khoá ngắn'} | Môn Lập trình`)
  const isDesktop = useIsDesktopViewport()
  // Hook phải chạy TRƯỚC mọi nhánh return sớm (luật hook của React).
  const outlineCtx = useProgrammingOutlineCtx()
  const progress = outlineCtx.progress
  const outline = course ? buildCourseOutline(course.id, outlineCtx) : undefined
  const { rail, trigger, sheet } = useOutlinePane({
    outline,
    title: TEN_MUC_LUC,
    storageKey: `khoa:${course?.id ?? 'none'}`,
    isDesktop,
    ...(outlineCtx.progressState === 'error'
      ? { footer: <LoiTienDo onRetry={outlineCtx.reload} /> }
      : {}),
  })

  // Mã khoá lạ → về trang tổng quan môn, không render trang rỗng.
  if (!course) return <Navigate to={PROGRAMMING_PREFIX} replace />

  // URL chỉ có mã (link cũ) hoặc phần mô tả không khớp tiêu đề hiện tại → chuyển hướng về URL
  // chuẩn, để Google không coi là hai trang nội dung trùng nhau (cùng luật trang bài học).
  const canonicalCourse = buildSlugSegment(course.id, course.title)
  if (courseSlugParam !== canonicalCourse) {
    return <Navigate to={`${PROGRAMMING_PREFIX}/khoa-hoc/${canonicalCourse}`} replace />
  }

  const allLessons = course.chapters.flatMap((ch) =>
    ch.lessonIds.map((id) => getLessonSummary(id)).filter((l) => l !== undefined),
  )
  const lessonCount = allLessons.length
  const completedCount = allLessons.filter((l) => isLessonCompleted(progress, l.id)).length

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout title={course.title} onBack={() => nav(PROGRAMMING_PREFIX)} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl">
        {/* Mục lục đứng BÊN TRÁI: nó là danh sách để CHỌN, mà mắt đọc từ trái sang — thứ
            "chọn trước rồi mới xem" phải đứng trước thứ được chọn (xem TwoPane.tsx).
            [S07-2] Mục lục NEO trong trang (`TocRail`) đổi thành CÂY bài học: từ đây bấm
            thẳng vào một bài, không phải cuộn xuống rồi mới bấm. */}
        <TwoPane isDesktop={isDesktop} railSide="left" railLabel={TEN_MUC_LUC} rail={rail}>
          <div className="space-y-6">
            <h1 tabIndex={-1} className="sr-only focus:outline-none">
              {course.title}
            </h1>
            {trigger}

            <section className="bg-zinc-900/80 border border-accent-500/30 rounded-3xl p-5 space-y-2 shadow-sm">
              <p className="text-xs text-zinc-300 leading-relaxed read-measure">
                <strong>Thời lượng:</strong> {course.duration}
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed read-measure">
                {course.prerequisites.length === 0 ? (
                  <>
                    <strong>Cần biết trước:</strong> không — vào thẳng học được.
                  </>
                ) : (
                  <>
                    <strong>Nên biết trước:</strong> {course.prerequisites.join(', ')}
                  </>
                )}
              </p>
            </section>

            {course.chapters.some((chapter) => chapter.weeks) && (
              <section
                className="course-flow bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4 overflow-hidden"
                aria-labelledby="course-flow-title"
              >
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-semibold text-accent-300">Bản đồ năng lực</p>
                    <h2 id="course-flow-title" className="text-base font-bold text-white mt-1">
                      Từ test đầu tiên tới hệ AI vận hành bền
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Mỗi chấm sáng là một giai đoạn có sản phẩm bàn giao.
                  </p>
                </div>
                <div className="relative grid grid-cols-6 sm:grid-cols-12 gap-2" aria-hidden="true">
                  <div className="absolute top-3 left-3 right-3 h-px bg-zinc-700" />
                  <div className="course-flow-beam absolute top-[10px] left-2 w-2 h-2 rounded-full bg-accent-300 shadow-[0_0_14px_currentColor]" />
                  {course.chapters.map((chapter, index) => (
                    <div key={chapter.id} className="relative flex flex-col items-center gap-2">
                      <span className="relative z-10 grid place-items-center w-6 h-6 rounded-full border border-accent-500/60 bg-zinc-950 text-[11px] font-bold text-accent-200">
                        {index + 1}
                      </span>
                      <span className="text-[11px] text-zinc-300 text-center leading-tight">
                        {chapter.weeks}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h2 className="text-base font-bold text-white">
                  {course.chapters.length} chương, {lessonCount} bài
                </h2>
                {lessonCount > 0 && (
                  <p className="text-xs text-zinc-400">
                    Đã hoàn thành{' '}
                    <strong className="text-emerald-300 theme-light:text-emerald-800">
                      {completedCount}/{lessonCount}
                    </strong>{' '}
                    bài học
                  </p>
                )}
              </div>
              {lessonCount > 0 && (
                <div
                  className="h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden"
                  role="progressbar"
                  aria-label={`Tiến độ khoá ${course.title}`}
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
              {course.chapters.map((chapter, idx) => {
                const lessons = chapter.lessonIds
                  .map((id) => getLessonSummary(id))
                  .filter((l) => l !== undefined)
                const chapterCompleted =
                  lessons.length > 0 && lessons.every((l) => isLessonCompleted(progress, l.id))
                return (
                  <div
                    key={chapter.id}
                    id={`chuong-${chapter.id}`}
                    // `scroll-mt-20` chừa chiều cao header dính — không có nó thì nhảy tới chương
                    // qua mục lục sẽ đưa tiêu đề chương nằm khuất sau header.
                    className="scroll-mt-20 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {chapter.weeks && (
                          <p className="text-xs font-semibold text-accent-300 mb-1">
                            Giai đoạn {idx + 1} · {chapter.weeks}
                          </p>
                        )}
                        <p className="text-sm font-bold text-white">
                          <span className="text-zinc-300 mr-2">Chương {idx + 1}</span>
                          {chapter.title}
                        </p>
                      </div>
                      {chapterCompleted && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 theme-light:text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed read-measure flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500" />
                      <span>{chapter.summary}</span>
                    </p>
                    {chapter.focus && (
                      <div
                        className="grid sm:grid-cols-2 gap-2 pt-1"
                        aria-label="Kiến thức trọng tâm"
                      >
                        {chapter.focus.map((item) => (
                          <p
                            key={item}
                            className="text-xs leading-relaxed text-zinc-200 rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2"
                          >
                            <span className="text-accent-300 mr-1.5">◆</span>
                            {item}
                          </p>
                        ))}
                      </div>
                    )}
                    {chapter.lab && (
                      <div className="rounded-2xl border border-sky-500/35 bg-sky-500/10 px-4 py-3 flex gap-3">
                        <FlaskConical
                          className="w-4 h-4 shrink-0 mt-0.5 text-sky-300 theme-light:text-sky-800"
                          aria-hidden="true"
                        />
                        <p className="text-xs leading-relaxed text-zinc-100">
                          <strong>Hands-on Lab:</strong> {chapter.lab}
                        </p>
                      </div>
                    )}
                    {chapter.deliverable && (
                      <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 flex gap-3">
                        <PackageCheck
                          className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300 theme-light:text-emerald-800"
                          aria-hidden="true"
                        />
                        <p className="text-xs leading-relaxed text-zinc-100">
                          <strong>Đầu ra:</strong> {chapter.deliverable}
                        </p>
                      </div>
                    )}
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="space-y-1.5">
                        <LangBadge language={lesson.language} />
                        <button
                          onClick={() => nav(duongDanBaiHoc(lesson, { courseId: course.id }))}
                          className="tap-44 w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Play className="w-4 h-4 shrink-0" />
                            <span className="truncate">Học bài: {lesson.title}</span>
                          </span>
                          {isLessonCompleted(progress, lesson.id) && (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </section>
          </div>
        </TwoPane>
      </PageShell>
      {sheet}
    </div>
  )
}
