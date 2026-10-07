// ProgrammingLessonPage — BÀI HỌC 8 BƯỚC môn Lập trình (PR-L3).
// Khuôn sư phạm (đặc tả §3): ①móc thực tế + ②khái niệm → ③ví dụ mẫu chạy được → ④Predict
// → ⑤Parsons (xếp dòng) → ⑥Tự viết chấm test-case → ⑦ứng dụng về nhà. (⑧ thẻ SRS: PR sau.)
// Code chạy bằng sandbox Pyodide tự host (lib/pythonRunner) — chấm bằng engine thuần
// (@dhcb/subject-programming/grading), tiến độ lưu server (lib/programmingProgress).
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import {
  useNavigate,
  useNavigationType,
  useParams,
  useLocation,
  Navigate,
  Link,
} from 'react-router-dom'
import {
  BookOpen,
  Play,
  Loader2,
  Lightbulb,
  Eye,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Home,
  ListChecks,
  Puzzle,
  PencilLine,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import LangBadge from '../../../components/programming/LangBadge'
import CodeSurface from '../../../components/programming/CodeSurface'
import RunOutput, { type RunState } from '../../../components/programming/RunOutput'
import StepBar, { type LessonStep } from '../../../components/programming/StepBar'
import StepRail from '../../../components/programming/StepRail'
import { MAIN_CONTENT_ID, PageShell } from '@core/PageShell'
import { LessonAnimation } from '@core/LessonAnimation'
import { TwoPane } from '@core/TwoPane'
import { useIsDesktopViewport, useMediaQuery } from '../../../lib/useIsDesktopViewport'
import { PROGRAMMING_PREFIX, duongDanBaiHoc, duongDanKhoa } from '../../../lib/programmingRoutes'
import { maKhoaTuQuery } from '../../../lib/programmingRoutesSpec'
import { lessonOutlineContext } from '../../../lib/outline/lessonOutlineContext'
import { useProgrammingOutlineCtx } from '../../../lib/useProgrammingOutlineCtx'
import { LoiTienDo } from '../../../components/OutlinePane'
import { useOutlinePane } from '../../../components/useOutlinePane'
import OutlinePrevNext from '../../../components/OutlinePrevNext'
import type { ShortCourseId } from '@dhcb/subject-programming/courses/types'
import LivePreview from '../../../components/programming/LivePreview'
import PredictStep from '../../../components/programming/PredictStep'
import ParsonsStep from '../../../components/programming/ParsonsStep'
import TestResultList from '../../../components/programming/TestResultList'
import AiHelpPanel from '../../../components/programming/AiHelpPanel'
import LessonProse from '../../../components/programming/LessonProse'
import CodeEditor from '../../../components/CodeEditor'
import Modal from '../../../components/Modal'
import { useAuth } from '../../../context/useAuth'
import { clearSession, contentFingerprint, type SessionOwner } from '../../../lib/learningSession'
import { useLearningSession } from '../../../lib/useLearningSession'
import { runLessonCode, resetLessonRunners, laBaiDongLenh } from '../../../lib/codeRunner'
import { saveLessonProgress } from '../../../lib/programmingProgress'
import { addLessonCardsToSrs } from '../../../lib/programmingSrs'
import type { ProgrammingLesson } from '@dhcb/subject-programming/lessonTypes'
import { useProgrammingLesson } from '../../../lib/useProgrammingLesson'
import { buildSlugSegment, idFromSlugSegment } from '@core/slug'
import {
  LESSON_HEAD_ANCHOR,
  LESSON_RESULT_ANCHOR,
  anchorOfStep,
  readEntryStep,
  resolveLessonTarget,
  withEntryStep,
  type LessonAnchor,
} from '../../../lib/programmingLessonSteps'
import { getLevelIdOfLesson } from '@dhcb/subject-programming/curriculum'
import { z } from 'zod'
import {
  gradeTestCase,
  gradeGitTestCase,
  allTestsPassed,
  checkParsonsOrder,
  parsonsShuffle,
  type TestCaseResult,
} from '@dhcb/subject-programming/grading'
import { usePageTitle } from '../../../lib/usePageTitle'

// 6 màn hình phủ 8 bước sư phạm (①② gộp một màn; ⑧ SRS chạy ngầm khi đạt bài Make).
// `graded` = bước có chấm (pha TRẢ) · `startsPhase` = vẽ vạch ngăn phía trước (luật N3).
// `key` đồng thời là id DOM + hash của heading bước — bảng chốt ở `lib/programmingLessonSteps`
// (S09d, đặc tả S09 §2.8); ca S09-P-AC01 trong ProgrammingLessonPage.test.tsx canh hai nơi khớp nhau.
const STEPS: readonly LessonStep[] = [
  { key: 'concept', label: 'Khái niệm', icon: BookOpen },
  { key: 'example', label: 'Ví dụ mẫu', icon: Play },
  { key: 'predict', label: 'Dự đoán', icon: ListChecks, graded: true, startsPhase: 'luyện tập' },
  { key: 'parsons', label: 'Xếp code', icon: Puzzle, graded: true },
  { key: 'make', label: 'Tự viết', icon: PencilLine, graded: true },
  { key: 'done', label: 'Về nhà', icon: Home, startsPhase: 'hoàn tất' },
] as const

// --- Nháp phiên học (S08-2) -------------------------------------------------------------
// Nháp = ĐÚNG những gì người học tự gõ/chọn, không hơn: code, lựa chọn Dự đoán, thứ tự Parsons,
// số gợi ý đã mở, đã xem code mẫu chưa. KẾT QUẢ CHẤM (`results`/`passed`) KHÔNG phải nháp —
// mở lại bài phải bấm "Chấm bài" để chấm thật, không tin con số lưu trên máy.
// Dữ liệu đọc từ localStorage là dữ liệu NGOÀI (sửa được bằng devtools) → luôn qua Zod.
const MAX_CODE_CHARS = 8000
const nhapSchema = z.object({
  code: z.string().max(MAX_CODE_CHARS),
  predictChoice: z.number().int().nonnegative().nullable(),
  arranged: z.array(z.string().max(200)).max(12),
  hintsShown: z.number().int().nonnegative().max(10),
  sampleViewed: z.boolean(),
})
type NhapBaiLapTrinh = z.infer<typeof nhapSchema>

/** Nhãn bước cho thẻ "Học tiếp" (slice S06 đọc qua `listResumableSessions`). */
function nhanBuoc(i: number): string {
  return STEPS[i]?.label ?? ''
}

/**
 * Vân tay khung bài: đổi phần nào trong đây thì code đã gõ có thể không còn khớp đề nữa, nên
 * nháp cũ chuyển thành `stale` và trang HỎI người học trước khi đổ lại (không tự prefill).
 */
function vanTayBai(lesson: ProgrammingLesson): string {
  return contentFingerprint([
    lesson.id,
    lesson.title,
    lesson.make.starterCode,
    lesson.make.testCases.length,
    lesson.parsons.lines.join('\n'),
    lesson.predict.choices.length,
  ])
}

/**
 * VỎ NGOÀI: đọc URL → nạp lười ĐÚNG unit chứa bài (mỗi unit một chunk, không kéo cả môn) →
 * mới dựng thân trang. Tách vỏ/thân vì các hook của thân trang khởi tạo từ nội dung bài
 * (starterCode, Parsons…) nên bài phải có sẵn TRƯỚC khi thân trang mount.
 */
export default function ProgrammingLessonPage() {
  const { lessonId: lessonSlugParam } = useParams<{ lessonId: string }>()
  const { search, hash } = useLocation()
  const lessonId = lessonSlugParam ? idFromSlugSegment(lessonSlugParam) : undefined
  const trangThai = useProgrammingLesson(lessonId)
  usePageTitle(
    `${trangThai.status === 'ready' && trangThai.lesson ? trangThai.lesson.title : 'Bài học'} | Môn Lập trình`,
  )
  // Ngữ cảnh khoá ngắn (`?khoa=git`) — mã lạ trả `undefined`, trang lặng lẽ dùng cây bậc.
  const courseId = maKhoaTuQuery(new URLSearchParams(search))

  if (trangThai.status === 'loading') {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Layout />
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="focus:outline-none max-w-4xl mx-auto px-4 pt-6"
          aria-busy="true"
        >
          <p className="flex items-center gap-2 text-sm text-zinc-300" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Đang tải bài học…</span>
          </p>
        </main>
      </div>
    )
  }
  if (trangThai.status === 'error') {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Layout />
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="focus:outline-none max-w-4xl mx-auto px-4 pt-6 space-y-3"
        >
          <p className="text-sm text-zinc-200" role="alert">
            Không tải được nội dung bài học (mất mạng?). Thử lại nhé.
          </p>
          <button
            type="button"
            onClick={trangThai.retry}
            className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition"
          >
            Tải lại bài học
          </button>
        </main>
      </div>
    )
  }
  const lesson = trangThai.lesson
  if (!lesson) return <Navigate to={PROGRAMMING_PREFIX} replace />

  // URL cũ chỉ có id (không có phần mô tả) hoặc slug mô tả không khớp tiêu đề hiện tại
  // (bài học đã đổi tên) → chuyển hướng về URL chuẩn để không bị Google coi là 2 trang khác
  // nhau (nội dung trùng).
  const canonicalSegment = buildSlugSegment(lesson.id, lesson.title)
  if (lessonSlugParam !== canonicalSegment) {
    // GIỮ NGUYÊN query khi chuyển hướng: `?khoa=<khoá ngắn>` là ngữ cảnh khoá đang học
    // (xem `duongDanBaiHoc`), mất nó là người học mở link cũ xong lạc khỏi khoá của mình.
    // GIỮ cả hash (S09d): link cũ `…/p1-u1-l1#make` phải mở đúng bước Tự viết. `replace` nên
    // chuyển hướng không để lại history entry thừa.
    return <Navigate to={`${duongDanBaiHoc(lesson)}${search}${hash}`} replace />
  }
  // key theo id: đổi bài là dựng lại thân trang từ đầu (state bước/code không dính bài cũ).
  return <LessonBody key={lesson.id} lesson={lesson} courseId={courseId} />
}

function LessonBody({
  lesson,
  courseId,
}: {
  lesson: ProgrammingLesson
  courseId: ShortCourseId | undefined
}) {
  const nav = useNavigate()
  const loc = useLocation()
  const navType = useNavigationType()
  const { user } = useAuth()

  // --- Owner của mọi kết quả chạy/chấm (S09d, đặc tả S09 §2.8 mục 5) -------------------
  // `LessonBody` chỉ dựng lại khi ĐỔI BÀI (key = lesson.id). Đổi tài khoản giữa chừng (đăng
  // nhập/đăng xuất) thì trang KHÔNG dựng lại — nên mỗi kết quả phải mang theo owner đã tạo ra
  // nó, và chỉ được hiện khi owner đó còn là owner hiện tại. Callback bất đồng bộ (máy chạy
  // code trả về chậm) còn bị chặn thêm bằng số thế hệ: owner đổi là mọi lượt cũ mất hiệu lực.
  const owner = useMemo<SessionOwner | null>(
    () => (user ? { kind: user.isGuest ? 'guest' : 'account', id: user.id } : null),
    [user],
  )
  const ownerKey = owner ? `${owner.kind}:${owner.id}` : ''
  const ownerKeyRef = useRef(ownerKey)
  // "Thế hệ" owner: tăng mỗi lần owner đổi; lượt chạy/chấm nào bắt đầu ở thế hệ cũ thì bỏ.
  // `useLayoutEffect` (không phải `useEffect`): tăng NGAY trong commit, trước khi bất kỳ
  // promise nào của máy chạy code kịp resolve và ghi state của owner cũ sau lượt reset dưới.
  const theHeOwnerRef = useRef(0)
  useLayoutEffect(() => {
    if (ownerKeyRef.current === ownerKey) return
    ownerKeyRef.current = ownerKey
    theHeOwnerRef.current += 1 // vô hiệu hoá mọi lượt chạy/chấm đang dở của owner cũ
  }, [ownerKey])

  // ③ Ví dụ mẫu. Luật N4: 3 trạng thái rõ ràng, không có ca "chạy xong mà màn hình trống".
  const [viDu, setViDu] = useState<{ owner: string; state: RunState; output: string } | null>(null)
  const viDuCuaOwner = viDu && viDu.owner === ownerKey ? viDu : null
  const exampleState: RunState = viDuCuaOwner?.state ?? 'idle'
  const exampleOutput = viDuCuaOwner?.output ?? ''
  const shuffledLines = useMemo(() => parsonsShuffle(lesson.parsons.lines, lesson.id), [lesson])
  // KẾT QUẢ CHẤM không nằm trong nháp: mở lại bài là phải bấm "Chấm bài" để chấm THẬT.
  // Chỉ sống trong bộ nhớ của lần mở bài này — nhảy bước (đổi hash) giữ nguyên, reload thì mất.
  const [cham, setCham] = useState<{
    owner: string
    grading: boolean
    results: TestCaseResult[] | null
  } | null>(null)
  const chamCuaOwner = cham && cham.owner === ownerKey ? cham : null
  const grading = chamCuaOwner?.grading ?? false
  const results = chamCuaOwner?.results ?? null
  const tongSoCa = lesson.make.testCases.length
  // Lượt chấm chỉ được coi là XONG khi đã dừng VÀ đủ số ca của bài. `allTestsPassed` trên
  // một mảng dở dang (mới 1/4 ca về, ca đó đạt) trả true — trước S09d trang từng báo "Đạt
  // toàn bộ test!" giữa lúc đang chấm. Đây chỉ là trạng thái TRÌNH BÀY: việc ghi completed/xoá
  // nháp trong `gradeMake` vẫn quyết trên mảng đủ ca như cũ.
  const chamXong = !grading && results !== null && results.length === tongSoCa
  // Đã bấm "Kiểm tra thứ tự" chưa — cũng không lưu: kết quả Parsons được TÍNH LẠI bằng hàm
  // thuần `checkParsonsOrder`, không có con số đúng/sai nào được cất trên máy.
  const [parsonsChecked, setParsonsChecked] = useState(false)
  const passed = chamXong && allTestsPassed(results)
  // Owner đổi → XOÁ HẲN kết quả trong bộ nhớ (không chỉ ẩn theo owner). Nếu chỉ ẩn, lượt chấm
  // dở của A bị bỏ ở `await` kế tiếp sẽ để lại `{owner: A, grading: true}`: A đăng nhập lại là
  // kẹt "Đang chấm…" và nút "Chấm bài" bị chặn mãi (ca test A → B → A). Mẫu "chỉnh state khi
  // prop đổi ngay trong render" của React — không cần effect, không có khung hình trung gian.
  const [ownerCuaKetQua, setOwnerCuaKetQua] = useState(ownerKey)
  if (ownerCuaKetQua !== ownerKey) {
    setOwnerCuaKetQua(ownerKey)
    setCham(null)
    setViDu(null)
    setParsonsChecked(false)
  }

  // --- Phiên học: bước + nháp sống qua reload, CÙNG THIẾT BỊ (S08-2) ---------------------
  // Đặc tả: docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md
  // Nháp KHÔNG phải tiến độ: nó không gọi API, không đổi "đã hoàn thành hay chưa" — việc đó
  // vẫn chỉ do server quyết (`saveLessonProgress` bên dưới, giữ nguyên).
  const contentVersion = useMemo(() => vanTayBai(lesson), [lesson])
  const macDinh = useCallback(
    () => ({
      stepIndex: 0,
      draft: {
        code: lesson.make.starterCode,
        predictChoice: null,
        arranged: [],
        hintsShown: 0,
        sampleViewed: false,
      } as NhapBaiLapTrinh,
    }),
    [lesson],
  )
  const phien = useLearningSession<NhapBaiLapTrinh>({
    owner,
    subjectId: 'programming',
    contentId: lesson.id,
    contentVersion,
    draftSchema: nhapSchema,
    initial: macDinh,
    stepLabel: nhanBuoc,
    // Đạt hết test → nháp đã bị xoá, đừng ghi lại (xem §7 Q6: mở lại bài đã xong là bắt đầu sạch).
    paused: passed,
    ...(courseId ? { courseId } : {}),
  })
  const { setStep, stepIndex: resumeStep } = phien
  const { code, predictChoice, arranged, hintsShown, sampleViewed } = phien.draft
  const suaNhap = phien.setDraft
  const setCode = useCallback(
    (giaTri: string) => suaNhap((d) => ({ ...d, code: giaTri })),
    [suaNhap],
  )
  // Suy ra, không lưu: đã chọn đáp án Dự đoán nghĩa là đã lật giải thích.
  const predictRevealed = predictChoice !== null
  const parsonsResult: 'correct' | 'wrong' | null = !parsonsChecked
    ? null
    : checkParsonsOrder(arranged, lesson.parsons.lines)
      ? 'correct'
      : 'wrong'

  // Ghi "đang học" khi vào bài; rời trang huỷ mọi worker chạy code (Python/JavaScript).
  useEffect(() => {
    if (user) void saveLessonProgress(user.id, lesson.id, 'in_progress')
    return () => resetLessonRunners()
  }, [user, lesson])

  const runExample = async () => {
    const luot = theHeOwnerRef.current
    const chuLuot = ownerKey
    setViDu({ owner: chuLuot, state: 'running', output: '' })
    const r = await runLessonCode(lesson.language, lesson.workedExample.code, {
      stdinLines: lesson.workedExample.stdinLines,
      onOutput: (output) => {
        if (theHeOwnerRef.current === luot) setViDu({ owner: chuLuot, state: 'running', output })
      },
      ...(lesson.domHtml ? { domHtml: lesson.domHtml } : {}),
    })
    if (theHeOwnerRef.current !== luot) return // owner đã đổi — bỏ kết quả của phiên cũ
    setViDu({ owner: chuLuot, state: 'done', output: r.output + (r.error ? `\n${r.error}` : '') })
  }

  const gradeMake = async () => {
    if (grading) return
    const luot = theHeOwnerRef.current
    const chuLuot = ownerKey
    setCham({ owner: chuLuot, grading: true, results: null })
    const out: TestCaseResult[] = []
    for (const testCase of lesson.make.testCases) {
      const r = await runLessonCode(lesson.language, code, {
        stdinLines: testCase.stdinLines,
        ...(lesson.domHtml ? { domHtml: lesson.domHtml } : {}),
        // Bài SQL: ca chấm có thể mang bộ dữ liệu riêng (bảng rỗng, có NULL, thứ tự khác).
        ...(testCase.datasetSql ? { datasetSql: testCase.datasetSql } : {}),
      })
      // Owner đổi giữa lúc chấm → lượt này thuộc phiên cũ: không hiện, không ghi gì thêm.
      if (theHeOwnerRef.current !== luot) return
      out.push(
        lesson.language === 'git'
          ? gradeGitTestCase(testCase, {
              ...r,
              error: r.error ?? (r.timedOut ? 'Quá thời gian' : undefined),
            })
          : gradeTestCase(
              testCase,
              r.output,
              r.error ?? (r.timedOut ? 'Quá thời gian' : undefined),
            ),
      )
      setCham({ owner: chuLuot, grading: true, results: [...out] })
    }
    setCham({ owner: chuLuot, grading: false, results: out })
    if (allTestsPassed(out) && owner) {
      // Bài xong thì nháp hết nghĩa ("resume" là cho việc DỞ) — xoá ngay, và `paused` ở trên
      // giữ cho nó không bị ghi lại khi người học bấm tiếp sang bước "Về nhà".
      clearSession({ owner, subjectId: 'programming', contentId: lesson.id })
    }
    if (allTestsPassed(out) && user) {
      // ADR-0007 + ADR-0008: kèm code để server chấm lại trước khi ghi nhận 'completed'. Gửi
      // cho MỌI bài (không lọc ở client): server tự quyết bài nào trong phạm vi chấm lại
      // (`isServerRegradableLesson`) và bỏ qua tham số này với bài ngoài phạm vi.
      void saveLessonProgress(user.id, lesson.id, 'completed', code)
      // ⑧ Thẻ SRS vào vòng ôn NGAY khi đạt bài (PR-L10): đó là lúc học viên vừa hiểu, nên
      // lịch ôn đầu tiên tính từ đây mới đúng. Gọi nhiều lần cũng vô hại — addToSRS bỏ qua
      // thẻ đã có trong kho, không đặt lại lịch của thẻ đang ôn dở.
      addLessonCardsToSrs(user.id, lesson.id)
    }
  }

  const stepDone = (i: number): boolean => {
    if (i === 2) return predictRevealed
    if (i === 3) return parsonsResult === 'correct'
    if (i === 4) return passed
    return true
  }

  // --- Bước ↔ URL (S09d, đặc tả S09 §2.8) ------------------------------------------------
  // Bước đang HIỆN được SUY RA từ URL mỗi lượt render (không phải một state thứ hai phải giữ
  // cho khớp): hash hợp lệ thắng bước resume; không hash thì dùng resume (mở bài) hoặc bước
  // ghi trong history entry (Back/Forward). Hàm quyết định là hàm thuần `resolveLessonTarget`.
  // Nháp (code, lựa chọn Dự đoán, thứ tự Parsons, gợi ý, đã xem mẫu) KHÔNG bao giờ bị đụng ở
  // đây — đổi bước chỉ đổi màn đang hiện.
  const [mountKey] = useState(loc.key)
  const target = resolveLessonTarget({
    hash: loc.hash,
    // Entry lúc mở bài (kể cả reload — trình duyệt báo POP) là "mở"; POP tới entry KHÁC trong
    // lúc trang đang mở mới là Back/Forward.
    navigation: loc.key !== mountKey && navType === 'POP' ? 'history' : 'open',
    resumeStep,
    entryStep: readEntryStep(loc.state),
  })
  const step = target.stepIndex
  const current = STEPS[step]!
  // Phiên đã hydrate xong: có owner, đã đọc storage, và KHÔNG còn hộp hỏi nháp cũ (stale). Chưa
  // xong thì chưa ghi bước URL vào phiên (không đè nháp stale trước khi người học quyết) và chưa
  // focus (hộp hỏi đang giữ focus).
  const hydrated = phien.status !== 'loading' && phien.staleSession === null

  /** Focus heading đích rồi cuộn tới (heading có `scroll-mt-*` chừa header dính). */
  const focusAnchor = useCallback((anchor: LessonAnchor) => {
    // id là hằng số đã chốt, KHÔNG phải chuỗi lấy từ URL — không dùng hash làm selector.
    const el = document.getElementById(anchor) ?? document.getElementById(LESSON_HEAD_ANCHOR)
    if (!el) return
    el.focus({ preventScroll: true })
    // Chỉ cuộn khi heading đang bị header dính che hoặc nằm ngoài khung nhìn — bấm một bước
    // ngay dưới thanh bước thì heading đã ở trong tầm mắt, cuộn thêm chỉ làm trang giật.
    // Vùng header lấy từ chính `scroll-margin-top` của heading (lớp `scroll-mt-*`), không đặt
    // một con số thứ hai phải giữ cho khớp.
    const vungHeader = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    const hop = el.getBoundingClientRect()
    const daThay = hop.top >= vungHeader && hop.bottom <= window.innerHeight
    // `instant`: không phụ thuộc animation, người bật giảm chuyển động không bị cuộn trượt.
    if (!daThay && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
  }, [])

  // Mỗi entry history chỉ xử lý MỘT lần (theo `location.key`): ghi bước vào phiên (để resume
  // lần sau đúng chỗ) + focus đích. Không chạy lại khi bước resume đổi vì tab khác ghi — nếu
  // chạy lại, hai tab mở hai hash khác nhau sẽ ghi đè nhau qua sự kiện `storage` mãi mãi.
  const daXuLyKeyRef = useRef<string | null>(null)
  const focusDich = target.focus
  useEffect(() => {
    if (!hydrated || daXuLyKeyRef.current === loc.key) return
    const lanDau = daXuLyKeyRef.current === null
    daXuLyKeyRef.current = loc.key
    if (step !== resumeStep) setStep(step)
    // Mở bài bình thường (không hash) giữ hành vi cũ: không tự kéo focus.
    if (lanDau && focusDich === null) return
    if (focusDich) focusAnchor(focusDich)
  }, [hydrated, loc.key, step, resumeStep, setStep, focusDich, focusAnchor])

  // Vị trí MỚI NHẤT (hash + state của entry) mà `goTo` dựa vào để quyết định. KHÔNG đọc thẳng
  // `loc`: React Router v7 cập nhật location trong `startTransition`, nên khi máy chậm cú bấm
  // thứ hai chạy lúc trang CHƯA render lại, `loc` vẫn là entry cũ. `goTo` khi đó tưởng mình còn
  // ở entry đầu bài và `replace` đè mất entry vừa push → Back bỏ qua bước đó (bắt được trên CI ở
  // E2E S09-P-AC06, 2026-09-25). Ref được cập nhật NGAY khi chính trang điều hướng, và đồng bộ
  // lại theo `loc` sau mỗi lần commit (layout effect: trước khi trình duyệt nhận sự kiện kế).
  const viTriRef = useRef<{ hash: string; state: unknown }>({ hash: loc.hash, state: loc.state })
  useLayoutEffect(() => {
    viTriRef.current = { hash: loc.hash, state: loc.state }
  }, [loc])

  /**
   * Đi tới một đích: đích khác → push ĐÚNG MỘT entry (giữ pathname + query `?khoa=`…); cùng
   * đích → chỉ focus lại, không thêm entry. KHÔNG chạy code, không chấm, không lưu tiến độ.
   */
  const goTo = (anchor: LessonAnchor) => {
    const { hash, state } = viTriRef.current
    // "Cùng đích" = đúng hash đang mở, HOẶC chưa có hash mà bấm lại đúng bước đang hiện (mở bài
    // xong bấm "Khái niệm" trên thanh bước): màn hình không đổi thì không đẻ thêm entry Back.
    const cungDich = hash === `#${anchor}` || (hash === '' && anchor === anchorOfStep(step))
    if (cungDich) {
      if (hydrated) focusAnchor(anchor)
      return
    }
    // Entry hiện tại không hash và chưa ghi bước (entry lúc mở bài): ghi bước đang hiện vào
    // chính nó (replace, không thêm entry) để Back về đây trả đúng bước này, không lấy bước
    // resume mà các lần nhảy sau sẽ thay đổi.
    if (!hash && readEntryStep(state) === undefined) {
      nav(
        { pathname: loc.pathname, search: loc.search },
        { replace: true, state: withEntryStep(state, step) },
      )
    }
    nav({ pathname: loc.pathname, search: loc.search, hash: `#${anchor}` })
    // Entry vừa push không mang state (React Router đặt `null`).
    viTriRef.current = { hash: `#${anchor}`, state: null }
  }
  const goToStep = (i: number) => goTo(anchorOfStep(i))

  /** Link trong trang (`href="#…"`): để trình duyệt tự xử lý khi mở tab mới/cmd-click.
   *  Nhận thẳng `(e, anchor)` và gọi từ arrow inline trong JSX — KHÔNG làm hàm "tạo handler"
   *  gọi lúc render, vì `goTo` đọc ref và luật `react-hooks/refs` coi đó là đọc ref khi render. */
  const onAnchorClick = (e: MouseEvent<HTMLAnchorElement>, anchor: LessonAnchor) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    goTo(anchor)
  }

  const isDesktop = useIsDesktopViewport()
  const levelId = getLevelIdOfLesson(lesson.id)

  // --- Mục lục môn/khoá (S07-2) ---------------------------------------------------------
  // Bốn thứ phải khớp nhau (cây · breadcrumb · nút quay lại · bài trước/sau) nên chúng được
  // quyết CÙNG MỘT CHỖ, ở hàm thuần `lessonOutlineContext` — xem chú thích tại file đó.
  // NGƯỠNG RIÊNG 1440px cho cột mục lục ở TRANG BÀI (các trang khác vẫn là 1024px).
  //
  // Trang này đã có một cột phụ — thanh bước bài học. Thêm cột mục lục nữa là BA cột cạnh
  // sidebar, và ở 1280px cột giữa tụt xuống ~380px: đo được bằng cổng a11y, ô soạn code
  // (CodeMirror) sinh thanh cuộn ngang và rớt `scrollable-region-focusable` ở cả 5 theme.
  // Dưới 1440px, mục lục vẫn tới được đầy đủ qua nút "Mục lục môn học" + panel — không mất
  // tính năng, chỉ đổi cách mở. Đây là ngoại lệ có chủ đích so với AC-10 (ghi ở changelog).
  const coCotMucLuc = useMediaQuery('(min-width: 1440px)')
  const outlineCtx = useProgrammingOutlineCtx()
  const nguCanh = lessonOutlineContext(lesson.id, courseId, outlineCtx)
  const { outline, course: courseChuaBai, backTo, crumbs, khoaChuaBai, tenMucLuc } = nguCanh
  const { rail, trigger, sheet } = useOutlinePane({
    outline,
    activeContentId: lesson.id,
    title: tenMucLuc,
    storageKey: nguCanh.storageKey,
    isDesktop: coCotMucLuc,
    ...(outlineCtx.progressState === 'error'
      ? { footer: <LoiTienDo onRetry={outlineCtx.reload} /> }
      : {}),
  })

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* Quay lại ĐÚNG bậc của bài đang học (PR-UX1). Trước đây ghi cứng '/lap-trinh/p1' nên
          học xong bài P5 bấm quay lại là rơi về bậc P1. Mã bài lạ → lùi về trang môn. */}
      {/* `focus`: trang ngồi học lâu → ẩn bộ chuyển Studio + huy hiệu streak (xem Layout). */}
      {/* Đốt CUỐI phải là TÊN BÀI: `Breadcrumb` cố tình cắt bỏ đốt cuối (trang hiện tại thì
          bấm vào chính mình là vô nghĩa). Trước đợt này trang chỉ truyền đốt "bậc học", nên
          chính nó bị cắt và breadcrumb dừng ở "Lập trình" — thấy rõ trên ảnh chụp Tầng 8b.
          Thêm tên bài vào cuối là đốt bậc/khoá hiện ra đúng như đặc tả AC-13. */}
      {/* [2026-10-01, đồng nhất khung bài học] KHÔNG truyền `title`: tên bài là <h1> hiện trong
          nội dung, như bài STEM và bài hội thoại. Trước đây tên bài chỉ nằm ở header (15px, cắt
          cụt "Chương trình đầu tiên — …" ở 390/1024px) còn <h1> bị ẩn. Đốt cuối của `crumbs` vẫn
          là tên bài để nhãn nút Back ra đúng đốt cha (bậc/khoá). */}
      <Layout
        onBack={() => nav(backTo)}
        crumbs={[...crumbs, { label: lesson.title, to: '' }]}
        focus
      />

      {/* [2026-09-02, đợt 1 thiết kế lại desktop] Trước đây trang này là MỘT cột `max-w-4xl`
          căn giữa ở mọi bề rộng màn hình: trên màn 1440px học viên thấy một cột chữ hẹp và
          gần một phần ba màn hình bỏ trống bên phải, lại không có gì cho biết mình đang ở
          bước nào trong bài. Nay ở desktop, chỗ trống đó thành cột điều hướng bước (StepRail),
          còn cột chữ giữ đúng khoảng đọc dễ chịu — "chiều sâu thay vì chiều rộng". */}
      <PageShell width={coCotMucLuc && rail ? 'wide' : 'standard'} baseWidth="max-w-4xl">
        {/* HAI cột phụ ở desktop: mục lục môn/khoá bên TRÁI (danh sách để chọn — mắt đọc từ
            trái sang), các bước bài học bên PHẢI (ngữ cảnh của việc đang làm). `TwoPane` chỉ
            mang một cột phụ mỗi lần nên lồng hai lớp, thay vì nới hợp đồng của nó. */}
        <TwoPane isDesktop={coCotMucLuc} railSide="left" railLabel={tenMucLuc} rail={rail}>
          <TwoPane
            isDesktop={isDesktop}
            railLabel="Các bước bài học"
            rail={<StepRail steps={STEPS} current={step} isDone={stepDone} onGo={goToStep} />}
          >
            <div className="space-y-5">
              {/* Đích `#dau-bai` (S09d). [2026-10-01] Tên bài HIỆN thường trực, cùng thang chữ tiêu
                  đề bài của STEM và hội thoại (`text-2xl sm:text-3xl font-extrabold`); header thôi
                  nhắc lại tên bài nên không lặp chữ. Vẫn nhận focus bằng mã lệnh (hash lạ, Back
                  về đầu bài) với vòng focus nhìn thấy được. */}
              <h1
                id={LESSON_HEAD_ANCHOR}
                tabIndex={-1}
                className="text-2xl sm:text-3xl font-extrabold leading-tight text-content rounded-lg scroll-mt-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {lesson.title}
              </h1>

              {/* Ngôn ngữ của bài + nút mở mục lục (mobile) + lối về đúng bậc/khoá (PR-UX1). */}
              <div className="flex items-center gap-2 flex-wrap -mt-3">
                <LangBadge language={lesson.language} />
                {trigger}
                {(levelId || courseChuaBai) && (
                  <button
                    onClick={() => nav(backTo)}
                    className="tap-44 text-[0.6875rem] font-semibold text-zinc-400 hover:text-white underline underline-offset-2 transition"
                  >
                    {courseChuaBai
                      ? `Khoá ${courseChuaBai.title}`
                      : `Bậc ${levelId?.toUpperCase()}`}
                  </button>
                )}
                {/* Lối tắt tới kết quả chấm (S09d, §2.8): MỘT lần kích hoạt từ bất kỳ bước nào.
                    `#ket-qua` là đích CON của bước Tự viết, không phải bước thứ bảy — nên nó là
                    link riêng ở đây, không chen vào thanh bước. Chỉ điều hướng: không chấm. */}
                <a
                  href={`#${LESSON_RESULT_ANCHOR}`}
                  onClick={(e) => onAnchorClick(e, LESSON_RESULT_ANCHOR)}
                  className="tap-44 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line-subtle bg-surface-card text-xs font-semibold text-content-secondary hover:text-content transition"
                >
                  <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Kết quả chấm</span>
                </a>
              </div>

              {/* Trình duyệt chặn lưu (Safari riêng tư, chặn site data…): NÓI THẬT ngay từ đầu
                thay vì để người học gõ nửa tiếng rồi mất trắng khi reload. Là CHỮ (role=status)
                chứ không phải mỗi biểu tượng — người dùng trình đọc màn hình cũng phải nghe được. */}
              {phien.storageMode === 'memory' && (
                <p
                  role="status"
                  className="read-body rounded-2xl border border-line-subtle bg-surface-card p-4 text-content-secondary"
                >
                  Trình duyệt đang chặn lưu nháp — rời trang là mất phần đang gõ.
                </p>
              )}

              {/* Bài chỉ thuộc khoá ngắn, mở không kèm ngữ cảnh khoá → không có cây nào để vẽ.
                Chỉ đường về khoá chứa nó thay vì để người học đứng giữa trời (§3.4). */}
              {khoaChuaBai.length > 0 && (
                <p className="read-body rounded-2xl border border-line-subtle bg-surface-card p-4 text-content-secondary">
                  Bài này thuộc khoá:{' '}
                  {khoaChuaBai.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ', '}
                      <Link to={duongDanKhoa(c)} className="underline underline-offset-2">
                        {c.title}
                      </Link>
                    </span>
                  ))}
                  .
                </p>
              )}

              {/* Ở desktop thanh bước NGANG được thay hẳn bằng cột dọc bên phải. Dựng đúng một
                trong hai (không `lg:hidden`) để DOM không chứa hai danh sách bước trùng nhau —
                trình đọc màn hình sẽ đọc hai lần và Playwright báo strict-mode violation. */}
              {!isDesktop && (
                <StepBar steps={STEPS} current={step} isDone={stepDone} onGo={goToStep} />
              )}

              {/* ①② Móc thực tế + khái niệm */}
              {current.key === 'concept' && (
                <section className="space-y-4" aria-labelledby="concept">
                  <TieuDeBuoc id="concept">{current.label}</TieuDeBuoc>
                  <div className="bg-accent-500/10 border border-accent-500/30 rounded-3xl p-5">
                    <p className="read-body read-measure text-zinc-100">{lesson.hook}</p>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5">
                    <LessonProse text={lesson.theory} />
                  </div>
                  {lesson.animation && (
                    <LessonAnimation
                      spec={lesson.animation}
                      className="rounded-3xl border border-line-subtle bg-surface-card p-5 read-body [&_svg]:mx-auto [&_svg]:max-w-2xl"
                    />
                  )}
                </section>
              )}

              {/* ③ Ví dụ mẫu chạy được */}
              {current.key === 'example' && (
                <section className="space-y-3" aria-labelledby="example">
                  <TieuDeBuoc id="example">{current.label}</TieuDeBuoc>
                  <p className="read-body read-measure text-zinc-300">
                    Đọc từng dòng (chú thích tiếng Việt trong code) rồi bấm chạy để thấy kết quả
                    thật:
                  </p>
                  <CodeSurface code={lesson.workedExample.code} />
                  <button
                    onClick={() => void runExample()}
                    disabled={exampleState === 'running'}
                    className="tap-44 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-sm transition"
                  >
                    {exampleState === 'running' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>
                      {laBaiDongLenh(lesson.language) ? 'Chạy thử các lệnh' : 'Chạy ví dụ'}
                    </span>
                  </button>
                  <RunOutput state={exampleState} output={exampleOutput} />
                </section>
              )}

              {/* ④ Predict — dự đoán TRƯỚC khi chạy */}
              {current.key === 'predict' && (
                <section className="space-y-3" aria-labelledby="predict">
                  <TieuDeBuoc id="predict">{current.label}</TieuDeBuoc>
                  <PredictStep
                    predict={lesson.predict}
                    choice={predictChoice}
                    revealed={predictRevealed}
                    onChoose={(i) => suaNhap((d) => ({ ...d, predictChoice: i }))}
                  />
                </section>
              )}

              {/* ⑤ Parsons — bấm dòng để xếp thứ tự */}
              {current.key === 'parsons' && (
                <section className="space-y-3" aria-labelledby="parsons">
                  <TieuDeBuoc id="parsons">{current.label}</TieuDeBuoc>
                  <ParsonsStep
                    prompt={lesson.parsons.prompt}
                    shuffledLines={shuffledLines}
                    arranged={arranged}
                    result={parsonsResult}
                    onArrangedChange={(lines) => {
                      setParsonsChecked(false)
                      suaNhap((d) => ({ ...d, arranged: lines }))
                    }}
                    onCheck={() => setParsonsChecked(true)}
                  />
                </section>
              )}

              {/* ⑥ Make — tự viết, chấm test-case */}
              {current.key === 'make' && (
                <section className="space-y-3" aria-labelledby="make">
                  <TieuDeBuoc id="make">{current.label}</TieuDeBuoc>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5">
                    <p className="read-body read-measure text-zinc-200 whitespace-pre-line">
                      {lesson.make.prompt}
                    </p>
                  </div>
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    // Bài Git/dòng lệnh: học viên gõ LỆNH chứ không phải code — nhãn phải nói đúng
                    // thứ đang làm, nhất là với người dùng trình đọc màn hình.
                    ariaLabel={
                      laBaiDongLenh(lesson.language)
                        ? 'Ô gõ lệnh bài tự viết'
                        : 'Ô soạn code bài tự viết'
                    }
                  />
                  {/* Khôi phục nháp đưa người học về đúng bước "Tự viết" nhưng KHÔNG khôi phục
                    kết quả chấm (kết quả không phải nháp) — nói rõ để không ai tưởng bài chấm
                    của mình biến mất. */}
                  {phien.status === 'restored' && code !== lesson.make.starterCode && (
                    <p role="status" className="read-body text-content-secondary">
                      Đã khôi phục code bạn gõ — bấm "Chấm bài" để chấm lại.
                    </p>
                  )}
                  <LivePreview language={lesson.language} domHtml={lesson.domHtml} code={code} />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => void gradeMake()}
                      disabled={grading || !code.trim()}
                      className="tap-44 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-sm transition"
                    >
                      {grading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span>{grading ? 'Đang chấm…' : 'Chấm bài'}</span>
                    </button>
                    {hintsShown < lesson.make.hints.length && (
                      <button
                        onClick={() => suaNhap((d) => ({ ...d, hintsShown: d.hintsShown + 1 }))}
                        className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 font-semibold text-sm transition"
                      >
                        <Lightbulb className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
                        <span>
                          Gợi ý ({hintsShown}/{lesson.make.hints.length})
                        </span>
                      </button>
                    )}
                    {!sampleViewed && (
                      <button
                        onClick={() => {
                          // "Phao": xem code mẫu — không phạt, chỉ ghi nhận để Companion kèm sát hơn.
                          suaNhap((d) => ({
                            ...d,
                            sampleViewed: true,
                            code: lesson.make.sampleSolution,
                          }))
                        }}
                        className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-semibold text-sm transition"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem code mẫu</span>
                      </button>
                    )}
                  </div>
                  {hintsShown > 0 && (
                    <ul className="space-y-2">
                      {lesson.make.hints.slice(0, hintsShown).map((hint, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-zinc-100"
                        >
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-400 theme-light:text-amber-900" />
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* ⑥b AI đồng hành — gợi ý soạn sẵn ở trên vẫn là đường CHÍNH (0đ, tức thì);
                AI chỉ dùng khi bí thật, và mỗi lượt hỏi tiêu 1 lượt AI trong ngày. */}
                  {/* `key` theo mã bài: trang này là CÙNG một instance khi `:lessonId` đổi (App.tsx
                render `<ProgrammingLessonPage />` không key), nên thiếu key thì panel mang
                nguyên trạng thái hỏi AI của bài trước sang bài sau. Không đặt key theo
                `code`/`results` — sửa code rồi chạy lại vẫn là bài đó, phải giữ bậc gợi ý. */}
                  <AiHelpPanel
                    key={lesson.id}
                    lessonId={lesson.id}
                    code={code}
                    results={results}
                    passed={passed}
                  />
                  {/* Kết quả chấm — đích `#ket-qua` (S09d, §2.8 mục 4). Heading LUÔN có trong bước
                      Tự viết để lối tắt/deep link luôn có chỗ đến, kể cả khi chưa chấm lần nào.
                      Bốn trạng thái, không trạng thái nào được giả là "đã xong": đang chấm ·
                      chưa có kết quả trong lần mở này · dừng mà thiếu ca · chấm xong đủ ca. */}
                  <section className="space-y-2" aria-labelledby={LESSON_RESULT_ANCHOR}>
                    <TieuDeBuoc id={LESSON_RESULT_ANCHOR} level={3}>
                      Kết quả chấm
                    </TieuDeBuoc>
                    <p className="read-body text-content-secondary">
                      {grading ? (
                        `Đang chấm… đã có ${results?.length ?? 0}/${tongSoCa} ca — chưa kết luận toàn bài.`
                      ) : results === null ? (
                        <>
                          Chưa có kết quả chấm trong lần mở bài này.{' '}
                          <a
                            href="#make"
                            onClick={(e) => onAnchorClick(e, 'make')}
                            className="underline underline-offset-2 text-content"
                          >
                            Lên đầu bước Tự viết
                          </a>{' '}
                          rồi bấm "Chấm bài".
                        </>
                      ) : results.length < tongSoCa ? (
                        `Lượt chấm chưa đầy đủ: mới có ${results.length}/${tongSoCa} ca — hãy bấm "Chấm bài" lại.`
                      ) : (
                        `Đã chấm xong ${tongSoCa} ca: đạt ${results.filter((r) => r.passed).length}/${tongSoCa}.`
                      )}
                    </p>
                    {results && <TestResultList results={results} />}
                    {passed && (
                      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-zinc-100 flex items-start gap-2">
                        <Trophy className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900 shrink-0" />
                        <p>
                          <strong>Đạt toàn bộ test!</strong> Đã gửi kết quả để ghi nhận hoàn thành
                          bài
                          {sampleViewed
                            ? ' (bạn có xem code mẫu — thử tự viết lại lần nữa nhé)'
                            : ''}
                          . Sang bước "Về nhà" để chốt bài.
                        </p>
                      </div>
                    )}
                  </section>
                </section>
              )}

              {/* ⑦ Ứng dụng về nhà */}
              {current.key === 'done' && (
                <section className="space-y-4" aria-labelledby="done">
                  <TieuDeBuoc id="done">{current.label}</TieuDeBuoc>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Home className="w-4 h-4 text-accent-400" />
                      <span>Ứng dụng vào đời thật</span>
                    </h3>
                    <p className="read-body read-measure text-zinc-200">{lesson.homework}</p>
                  </div>
                  <div
                    className={`rounded-3xl border p-5 text-sm ${
                      passed
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-900/80 text-zinc-300'
                    }`}
                  >
                    {/* "Về nhà" là bước cuối, KHÔNG đồng nghĩa đã đạt bài (§2.8): chỉ lượt chấm xong
                        đủ ca và đạt hết mới được nói "hoàn thành". */}
                    {passed
                      ? 'Bài học đã hoàn thành — bạn đạt hết test ở bước "Tự viết". 🎉'
                      : results === null
                        ? 'Chưa có kết quả chấm trong lần mở bài này — quay lại bước "Tự viết" và bấm "Chấm bài" để hoàn thành bài học.'
                        : 'Bạn chưa đạt hết test ở bước "Tự viết" — quay lại chấm bài để hoàn thành bài học.'}
                  </div>
                  <button
                    onClick={() => nav(backTo)}
                    className="tap-44 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition"
                  >
                    <span>
                      {levelId ? `Về trang bậc ${levelId.toUpperCase()}` : 'Về trang môn'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </section>
              )}

              {/* Điều hướng trước / sau */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => goToStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="tap-44 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 disabled:opacity-40 text-zinc-200 font-semibold text-sm transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Bước trước</span>
                </button>
                {step < STEPS.length - 1 && (
                  <button
                    onClick={() => goToStep(step + 1)}
                    className={`tap-44 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-semibold text-sm transition ${
                      stepDone(step)
                        ? 'bg-accent-500 hover:bg-accent-400 text-black'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span>Bước tiếp</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bài trước / bài sau theo ĐÚNG cây đang mở (giữ `?khoa=` nếu đang học theo khoá). */}
              <OutlinePrevNext outline={outline} contentId={lesson.id} />
            </div>
          </TwoPane>
        </TwoPane>
      </PageShell>

      {/* Bài đã được cập nhật kể từ lần trước: HỎI, không tự đổ nháp cũ đè lên đề mới.
          Chưa trả lời thì trang đang chạy bằng `starterCode` mới và bước 0 (hoặc bước theo hash
          URL) — đúng như đang thấy; bước URL chỉ được GHI vào phiên sau khi người học quyết
          (xem `hydrated` ở trên). */}
      {phien.staleSession && (
        <Modal
          title="Bài này đã được cập nhật"
          onClose={phien.discardStale}
          closeLabel="Bắt đầu mới"
          maxWidth="max-w-md"
        >
          <p className="read-body text-content-secondary">
            Nội dung bài đã đổi kể từ lần bạn học dở. Dùng lại code bạn đã gõ hay bắt đầu mới?
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={phien.adoptStale}
              className="tap-44 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition"
            >
              Dùng lại code đã gõ
            </button>
            <button
              type="button"
              onClick={phien.discardStale}
              className="tap-44 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200 font-semibold text-sm transition"
            >
              Bắt đầu mới
            </button>
          </div>
        </Modal>
      )}
      {sheet}
    </div>
  )
}

/**
 * Heading của một bước / đích con — đích focus khi nhảy tới (S09d, §2.8 mục 7). `id` là hằng số
 * đã chốt ở `lib/programmingLessonSteps`; `tabIndex=-1` để focus được bằng script mà KHÔNG
 * chen vào thứ tự Tab; `scroll-mt-24` chừa chiều cao header dính khi cuộn tới.
 */
function TieuDeBuoc({
  id,
  level = 2,
  children,
}: {
  id: LessonAnchor
  level?: 2 | 3
  children: ReactNode
}) {
  const Tag = level === 2 ? 'h2' : 'h3'
  return (
    <Tag
      id={id}
      tabIndex={-1}
      className={`${level === 2 ? 't-h3' : 't-label'} text-content rounded-lg scroll-mt-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring`}
    >
      {children}
    </Tag>
  )
}
