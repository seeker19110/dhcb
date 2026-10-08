// apps/dhcb/src/pages/SubjectDetail.tsx — Specialized AI STEM Step Solver & Subject Studio
import { thongDiepLoiThanThien } from '../../lib/friendlyError'
import { useEffect, useState, useRef } from 'react'
import { Navigate, useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Sparkles,
  Send,
  CheckCircle2,
  RotateCcw,
  BookMarked,
  BookOpen,
  Flame,
  Camera,
  Calendar,
  Loader2,
  Volume2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import SubjectIllustration from '../../components/SubjectIllustration'
import { getSubjectDetails, SubjectApiError } from '../../lib/subjectApi'
import LoadError from '../../components/LoadError'
import { solveProblemImage } from '../../lib/visionSolverApi'
import { speak } from '../../lib/tts'
import IntegrationsModal from '../../components/IntegrationsModal'
import { STEM_CURRICULUM } from '../../data/stemCurriculum'
import type { SubjectManifest } from '@dhcb/core-contracts/subjectManifest'
import { goToSubjects } from '../../lib/subjectsHost'
import { isAppHostSubject, subjectHomePath } from '@dhcb/core-learner/subjectHome'
import { duongDanDanhSachBai, getStemSubject } from '../../lib/stemLessonRoutes'
import { usePageTitle } from '../../lib/usePageTitle'
import StemContinueBlock from '../../components/learning/StemContinueBlock'
import { buttonClass } from '@core/buttonStyles'

interface SolvedStep {
  title: string
  detail: string
  formula?: string
  socraticHint?: string
  pitfall?: string
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; subject: SubjectManifest }

export default function SubjectDetail() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const nav = useNavigate()
  const location = useLocation()
  // Môn có không gian hoạt động riêng (Tiếng Anh, Lập trình) KHÔNG có trang manifest: App.tsx
  // đã đặt route riêng cho chúng, nhánh này chỉ chạm tới khi ai đó dựng URL lạ. Đi thẳng tới
  // trang chủ môn thay vì fetch manifest rồi vẽ tab "Giải đề"/"Lớp 12" vô nghĩa cho Tiếng Anh.
  const ownHome = subjectId && isAppHostSubject(subjectId) ? subjectHomePath(subjectId) : null
  usePageTitle((subjectId && getStemSubject(subjectId)?.label) || 'Môn học')
  // [Trả nợ S03-1, 2026-09-15] Ba trạng thái tách bạch thay cho một biến `subject | null`.
  // Trước đây effect bắt MỌI lỗi bằng `.catch(() => goToSubjects(nav))`: mất mạng, 503 hay
  // payload sai đều đá người dùng ngược về danh sách môn, không một lời giải thích — người
  // học tưởng mình bấm nhầm, hoặc tưởng môn đã bị gỡ, và không có cách nào thử lại ngoài
  // việc mò lại đúng đường dẫn cũ.
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const subject = state.status === 'ready' ? state.subject : null
  // Chỉ TĂNG khi người dùng bấm "Thử lại" — không retry tự động, cùng lý do với Subjects.tsx.
  const [retryToken, setRetryToken] = useState(0)
  const [selectedGrade, setSelectedGrade] = useState<string>('grade_12')
  // [U9b, minor 12 audit 2026-09-30 — chủ dự án chốt 2026-10-05] Trang môn mở tab BÀI HỌC trước,
  // "AI giải bài tập" xếp sau: người tới trang môn để học, công cụ giải hộ là phụ. Chỉ mở thẳng
  // tab giải khi có đề truyền vào (`?q=` từ ô hỏi ở Trang chủ — xem nhánh đọc query bên dưới).
  const [activeTab, setActiveTab] = useState<'solver' | 'curriculum' | 'practice'>('curriculum')
  const [difficultyFilter, setDifficultyFilter] = useState<
    'all' | 'basic' | 'intermediate' | 'advanced'
  >('all')
  const [problemInput, setProblemInput] = useState('')
  const [solving, setSolving] = useState(false)
  const [solutionSteps, setSolutionSteps] = useState<SolvedStep[] | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleVisionSolve = async () => {
    if (!imagePreview || !subjectId) return
    setSolving(true)
    try {
      const res = await solveProblemImage({
        imageBase64: imagePreview,
        subjectId,
        gradeLevel: selectedGrade,
        userPrompt: problemInput || undefined,
      })
      setProblemInput(res.problemText)
      setSolutionSteps(
        res.steps.map((s) => ({
          title: s.title,
          detail: s.detail,
          formula: s.formula,
          socraticHint: 'Lưu ý kiểm tra lại điều kiện biên và thứ tự thực hiện phép tính.',
        })),
      )
    } catch (err: unknown) {
      const msg = thongDiepLoiThanThien(err, 'Lỗi phân tích ảnh đề bài')
      alert(msg)
    } finally {
      setSolving(false)
    }
  }

  // Đổi môn (Toán → Lý) hoặc bấm "Thử lại" → bật lại trạng thái tải NGAY TRONG RENDER, cùng
  // khuôn so-sánh-prev đã dùng ở `Subjects.tsx` và ở ngay dưới trong file này. KHÔNG gọi
  // `setState` đồng bộ trong thân effect: luật `react-hooks/set-state-in-effect` chặn CI, và
  // lý do nó chặn là cascading render thật.
  const [prevKey, setPrevKey] = useState(`${subjectId ?? ''}#${retryToken}`)
  const key = `${subjectId ?? ''}#${retryToken}`
  if (key !== prevKey) {
    setPrevKey(key)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    // Môn thuộc app host (ownHome) đã được chuyển hướng ở render — không gọi API manifest.
    if (!subjectId || ownHome) return
    // CHỐNG RACE: điều hướng nhanh giữa hai môn (Toán → Lý) có thể để response của môn CŨ về
    // sau và ghi đè môn đang xem. Cùng khuôn với `Subjects.tsx`: huỷ request cũ trong cleanup,
    // và chặn nốt lượt đã bay qua `fetch` bằng chính cờ `aborted` của controller.
    const controller = new AbortController()

    getSubjectDetails(subjectId, { signal: controller.signal })
      .then((s) => {
        if (controller.signal.aborted) return
        setState({ status: 'ready', subject: s })
        if (s.standardLevels.length > 0) {
          setSelectedGrade(s.standardLevels[0]!)
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setState({
          status: 'error',
          message:
            err instanceof SubjectApiError
              ? err.message
              : 'Không tải được thông tin môn học. Kiểm tra kết nối rồi thử lại.',
        })
      })

    return () => controller.abort()
  }, [subjectId, retryToken, ownHome])

  // Handle URL query parameters (e.g. ?q=... from Home search) — pattern so-sánh-prev
  // ngay trong render (không setState đồng bộ trong effect), chạy cả lần mount đầu.
  const [prevSearch, setPrevSearch] = useState<string | null>(null)
  if (location.search !== prevSearch) {
    setPrevSearch(location.search)
    const params = new URLSearchParams(location.search)
    const qParam = params.get('q')
    const gradeParam = params.get('grade')
    if (gradeParam) setSelectedGrade(gradeParam)
    if (qParam) {
      setProblemInput(qParam)
      setActiveTab('solver')
    }
  }

  const curriculumList = subjectId ? STEM_CURRICULUM[subjectId] || [] : []
  // Bốn môn STEM có kho bài học thật (nạp lười) — môn khác thì khối này vắng mặt.
  const stemSubject = getStemSubject(subjectId)
  const currentGradeData =
    curriculumList.find((g) => g.grade === selectedGrade) || curriculumList[0]
  // Môn chưa có khung chương trình thì hai tab đầu không có gì để hiện — rơi về tab giải bài
  // thay vì một vùng trống (bốn môn STEM hiện đều có khung, đây là lưới an toàn).
  const tab = currentGradeData ? activeTab : 'solver'

  const handleSolve = (e: React.FormEvent) => {
    e.preventDefault()
    if (!problemInput.trim()) return

    setSolving(true)
    setTimeout(() => {
      const isMath = subjectId === 'mathematics'
      const isChem = subjectId === 'chemistry'
      const isPhys = subjectId === 'physics'
      const p = problemInput.toLowerCase()

      if (isMath) {
        if (p.includes('tích phân') || p.includes('nguyên hàm')) {
          setSolutionSteps([
            {
              title: 'Bước 1: Nhận diện dạng tích phân & Đổi biến số',
              detail:
                'Đặt u = g(x) để đơn giản hóa biểu thức dưới dấu tích phân. Tính vi phân du = g’(x)dx.',
              formula: '\\int f(g(x)) g’(x) dx = \\int f(u) du',
              socraticHint: 'Đừng quên đổi cận tương ứng khi đổi biến số trong tích phân xác định!',
            },
            {
              title: 'Bước 2: Tính nguyên hàm theo biến u',
              detail: 'Áp dụng bảng nguyên hàm cơ bản để tìm họ nguyên hàm F(u).',
              formula: 'F(u) = \\frac{u^{n+1}}{n+1} + C \\quad (n \\neq -1)',
            },
            {
              title: 'Bước 3: Thay ngược lại biến x và kết luận',
              detail: 'Hoàn tất kết quả nguyên hàm hoặc thế cận nếu là tích phân xác định.',
              formula: 'I = F(b) - F(a)',
              pitfall: 'Coi chừng quên hằng số tích phân C khi tìm nguyên hàm bất định.',
            },
          ])
        } else {
          setSolutionSteps([
            {
              title: 'Bước 1: Xác định tập xác định & Đạo hàm',
              detail: 'Tập xác định D = R. Lấy đạo hàm bậc nhất của hàm số:',
              formula: "y' = 3x^2 - 6x = 3x(x - 2)",
              socraticHint: 'Xác định bậc của hàm số để biết số lượng điểm cực trị tối đa.',
            },
            {
              title: 'Bước 2: Tìm nghiệm của đạo hàm (Điểm dừng)',
              detail: "Giải phương trình y' = 0:",
              formula: '3x(x - 2) = 0 \\iff x = 0 \\quad \\text{hoặc} \\quad x = 2',
            },
            {
              title: 'Bước 3: Lập bảng biến thiên & Xét dấu',
              detail:
                "Trên (-∞, 0) và (2, +∞): y' > 0 (Hàm số đồng biến). Trên khoảng (0, 2): y' < 0 (Hàm số nghịch biến).",
              formula:
                "y'' (0) = -6 < 0 \\implies Cực đại; \\quad y''(2) = 6 > 0 \\implies Cực tiểu",
            },
            {
              title: 'Bước 4: Kết luận cực trị',
              detail:
                'Hàm số đạt Cực đại tại x = 0 (y_CD = 2); đạt Cực tiểu tại x = 2 (y_CT = -2).',
              formula: 'y_{\\text{cực đại}} = 2, \\quad y_{\\text{cực tiểu}} = -2',
              pitfall: 'Nghiệm bội chẵn của đạo hàm không làm đổi dấu nên không sinh ra cực trị!',
            },
          ])
        }
      } else if (isChem) {
        setSolutionSteps([
          {
            title: 'Bước 1: Xác định sự thay đổi số oxi hóa',
            detail:
              'Fe(0) → Fe(+3) + 3e (Quá trình oxi hóa)\nN(+5) + 3e → N(+2) (Quá trình khử trong NO)',
            socraticHint: 'Xác định chính xác chất khử (cho e) và chất oxi hóa (nhận e).',
          },
          {
            title: 'Bước 2: Thăng bằng electron',
            detail: 'Nhân hệ số 1 cho cả quá trình oxi hóa và quá trình khử (3e = 3e).',
            formula:
              '1 \\times | Fe \\to Fe^{+3} + 3e \\quad ; \\quad 1 \\times | N^{+5} + 3e \\to N^{+2}',
          },
          {
            title: 'Bước 3: Cân bằng số nguyên tử nguyên tố & Phân tử nước',
            detail: 'Đặt hệ số vào phương trình hóa học hoàn chỉnh:',
            formula: 'Fe + 4HNO_3 \\text{ (loãng)} \\to Fe(NO_3)_3 + NO\\uparrow + 2H_2O',
            pitfall: 'Cần đếm cả số phân tử axit đóng vai trò môi trường tạo muối.',
          },
        ])
      } else if (isPhys) {
        setSolutionSteps([
          {
            title: 'Bước 1: Tóm tắt giả thiết và đổi đơn vị',
            detail: 'm = 200g = 0.2 kg; k = 50 N/m; Biên độ A = 4 cm = 0.04 m.',
            socraticHint: 'Luôn đổi khối lượng sang kg và chiều dài sang mét trước khi tính.',
          },
          {
            title: 'Bước 2: Tính tần số góc ω và chu kỳ T',
            detail: 'Tần số góc ω = √(k / m) = √(50 / 0.2) = √250 ≈ 15.81 rad/s.',
            formula:
              'T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi}{15.81} \\approx 0.397 \\text{ (s)}',
          },
          {
            title: 'Bước 3: Tính vận tốc cực đại',
            detail: 'Vận tốc cực đại của vật khi qua vị trí cân bằng:',
            formula:
              'v_{\\text{max}} = \\omega A = 15.81 \\times 0.04 = 0.632 \\text{ (m/s)} = 63.2 \\text{ (cm/s)}',
            pitfall: 'Vận tốc cực đại xảy ra ở vị trí cân bằng (x = 0), không phải ở biên!',
          },
        ])
      } else {
        setSolutionSteps([
          {
            title: 'Bước 1: Xác định kiểu gen của P',
            detail: 'P: Cây hạt vàng dị hợp có kiểu gen Aa.',
            socraticHint: 'Quy ước gen: A - Hạt vàng (trội), a - Hạt xanh (lặn).',
          },
          {
            title: 'Bước 2: Sơ đồ lai tự thụ phấn',
            detail: 'P: Aa x Aa\nGiao tử: G_P = (1/2 A : 1/2 a) x (1/2 A : 1/2 a)',
            formula: 'F_1: \\frac{1}{4} AA : \\frac{2}{4} Aa : \\frac{1}{4} aa',
          },
          {
            title: 'Bước 3: Tỉ lệ phân ly kiểu hình',
            detail:
              'Tỉ lệ kiểu hình: 3 Hạt vàng (1 AA : 2 Aa) : 1 Hạt xanh (1 aa) (75% vàng : 25% xanh).',
            formula: '3 \\text{ Trội (Vàng)} : 1 \\text{ Lặn (Xanh)}',
          },
        ])
      }
      setSolving(false)
    }, 550)
  }

  const loadSampleProblem = (prompt: string, steps?: SolvedStep[]) => {
    setProblemInput(prompt)
    if (steps) {
      setSolutionSteps(steps)
    } else {
      setSolutionSteps(null)
    }
    setActiveTab('solver')
  }

  // Môn thuộc app host (Tiếng Anh, Lập trình) — đi thẳng tới trang chủ môn, TRƯỚC màn tải.
  if (ownHome) return <Navigate to={ownHome} replace />

  // Thiếu mã môn trong đường dẫn: chuyện của ĐƯỜNG DẪN, biết ngay lúc render, không cần
  // (và không được) đi vòng qua effect để dựng ra một trạng thái lỗi.
  const loi = !subjectId
    ? 'Đường dẫn thiếu mã môn học.'
    : state.status === 'error'
      ? state.message
      : null

  // [Trả nợ S03-1] Tải và lỗi là HAI màn hình khác nhau, và cả hai đều ở LẠI trang này.
  // Người dùng còn nguyên đường dẫn môn mình chọn, bấm "Thử lại" là gọi lại đúng môn đó.
  // `|| !subject` không thừa: `subject` là biến DẪN XUẤT nên TypeScript không tự thu hẹp nó
  // theo `state.status` ở phần dưới — thiếu vế này là hàng chục chỗ `subject.label` báo lỗi.
  if (state.status !== 'ready' || !subject) {
    // Header không được rỗng ở nhánh lỗi/tải (P2-2, audit 2026-09-22): tiêu đề lấy từ danh mục
    // môn STEM tĩnh — không cần chờ manifest động về mới biết tên môn.
    const tenMonTinh = subjectId ? getStemSubject(subjectId)?.label : undefined
    const tieuDe = tenMonTinh ?? 'Môn học'
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Layout title={tenMonTinh} onBack={() => goToSubjects(nav)} />
        <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            {tieuDe}
          </h1>
          {loi ? (
            <LoadError
              message={loi}
              hint="Đây là lỗi tải thông tin môn học, không phải môn đã bị gỡ — tiến độ của bạn vẫn còn nguyên."
              {...(subjectId ? { onRetry: () => setRetryToken((n) => n + 1) } : {})}
            />
          ) : (
            <div
              role="status"
              className="text-center py-12 text-zinc-400 text-sm flex items-center justify-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Đang tải thông tin môn học…</span>
            </div>
          )}
        </PageShell>
      </div>
    )
  }

  // Màu chủ đạo theo môn học
  const subjectTheme: Record<
    string,
    { from: string; via: string; to: string; accent: string; ring: string }
  > = {
    mathematics: {
      from: 'from-blue-600/30',
      via: 'via-cyan-600/15',
      to: 'to-indigo-600/20',
      accent: 'text-blue-400 theme-light:text-blue-800',
      ring: 'ring-blue-500/30',
    },
    physics: {
      from: 'from-purple-600/30',
      via: 'via-violet-600/15',
      to: 'to-indigo-600/20',
      accent: 'text-purple-400 theme-light:text-purple-800',
      ring: 'ring-purple-500/30',
    },
    chemistry: {
      from: 'from-amber-600/30',
      via: 'via-orange-600/15',
      to: 'to-yellow-600/20',
      accent: 'text-amber-400 theme-light:text-amber-900',
      ring: 'ring-amber-500/30',
    },
    biology: {
      from: 'from-rose-600/30',
      via: 'via-pink-600/15',
      to: 'to-red-600/20',
      accent: 'text-rose-400 theme-light:text-rose-900',
      ring: 'ring-rose-500/30',
    },
    programming: {
      from: 'from-indigo-600/30',
      via: 'via-blue-600/15',
      to: 'to-violet-600/20',
      accent: 'text-indigo-400 theme-light:text-indigo-800',
      ring: 'ring-indigo-500/30',
    },
  }
  const theme = (subjectTheme[subjectId ?? ''] ?? subjectTheme['mathematics'])!

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout onBack={() => goToSubjects(nav)} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Danh sách bài học/bậc → width standard. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        {/* ─── HERO BANNER với Illustration động ─── */}
        <section
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.from} ${theme.via} ${theme.to} border border-zinc-800/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm animate-fade-up`}
        >
          {/* Nền mờ hình lục giác */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 1 l17 9.8v19.6L20 39 3 30.4V10.4z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E\")",
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative flex items-center justify-between gap-4">
            {/* Nội dung trái */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[0.6875rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${theme.ring} bg-zinc-900/60 ${theme.accent}`}
                >
                  AI Gia Sư
                </span>
                <span className="text-xs text-zinc-400">STEM học bổ trợ</span>
              </div>
              {/* [2026-09-05, đợt 2] Đây nay là tiêu đề DUY NHẤT của trang nên lên đúng cỡ
                  chữ tiêu đề trang của app (khớp `PageHeader`: text-2xl sm:text-3xl). */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                {subject.label}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2">
                {subject.description}
              </p>
              {/* Hẹp (390px): cột trái còn ~160px nên hai chỉ số xuống DÒNG có chủ đích (mỗi chỉ số
                  một dòng, chữ không bị bẻ giữa chừng); rộng thì nằm cùng một hàng. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <BookOpen className={`w-3.5 h-3.5 ${theme.accent}`} />
                  <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                    {currentGradeData?.chapters.length ?? 0} chương
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 ${theme.accent}`} />
                  <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                    AI giải từng bước
                  </span>
                </div>
              </div>
            </div>

            {/* Illustration động bên phải */}
            <div className="shrink-0 animate-float hidden sm:block">
              <SubjectIllustration subjectId={subjectId ?? 'mathematics'} size="hero" />
            </div>
            <div className="shrink-0 animate-float sm:hidden">
              <SubjectIllustration subjectId={subjectId ?? 'mathematics'} size="lg" />
            </div>
          </div>
        </section>

        {/* [2026-09-05, đợt 2 "desktop giáo dục"] Bỏ hẳn `PageHeader` ở đây.

            Trước đó trang nói CÙNG MỘT THỨ hai lần liên tiếp: hero in "Toán học" kèm mô tả
            môn, rồi ngay dưới `PageHeader` in "Gia Sư AI: Toán học" kèm đúng mô tả đó nhét
            trong ngoặc đơn. Thấy rõ trong ảnh chụp 1440px của đợt này — hai khối tiêu đề
            chồng nhau chiếm gần một phần ba màn hình đầu mà không thêm thông tin nào.

            Nó còn là lỗi ngữ nghĩa: trang có HAI thẻ `<h1>`. Nay hero là tiêu đề duy nhất. */}
        {/* Lối vào kho bài học có chấm điểm của môn (bốn môn STEM). Đặt ngay dưới hero vì đây
            là việc người học tới trang môn để làm, còn khung chương trình bên dưới chỉ để tra. */}
        {stemSubject && <StemContinueBlock subject={stemSubject} />}
        {stemSubject && (
          <Link
            to={duongDanDanhSachBai(stemSubject.id)}
            className="tap-44 flex items-center justify-between gap-4 rounded-3xl border border-line-strong bg-surface-card p-4 text-content"
          >
            <span>
              <span className="block font-semibold">Vào học {stemSubject.label}</span>
              <span className="block text-content-secondary">
                {stemSubject.loader.index.length} bài có hoạt ảnh minh hoạ và câu hỏi tự chấm
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Link>
        )}

        {/* Khối chọn khối lớp */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-accent-400" />
            <span className="text-sm font-semibold text-white">Khối lớp / Cấp độ:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {subject.standardLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedGrade(lvl)}
                className={`tap-44 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedGrade === lvl
                    ? 'bg-accent-500 text-[#09090b] shadow-sm shadow-accent-500/20 scale-105'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {lvl.replace('grade_', 'Lớp ').toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Tab chuyển đổi tính năng: Bài học (chương trình) → Luyện tập → AI giải bài tập */}
        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            aria-pressed={tab === 'curriculum'}
            className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              tab === 'curriculum'
                ? 'bg-accent-500/20 text-accent-400 theme-light:text-accent-800 border border-accent-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bài học & công thức ({currentGradeData?.chapters.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            aria-pressed={tab === 'practice'}
            className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              tab === 'practice'
                ? 'bg-accent-500/20 text-accent-400 theme-light:text-accent-800 border border-accent-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400 theme-light:text-orange-900" />
            <span>Bài tập trọng tâm</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solver')}
            aria-pressed={tab === 'solver'}
            className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              tab === 'solver'
                ? 'bg-accent-500/20 text-accent-400 theme-light:text-accent-800 border border-accent-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI giải bài tập</span>
          </button>
        </div>

        {/* TAB 1: AI SOLVER */}
        {tab === 'solver' && (
          <div className="space-y-6">
            {/* Khung giải bài tập */}
            <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-400" />
                  <span>Nhập đề bài hoặc tải ảnh chụp</span>
                </h2>
                {problemInput && (
                  <button
                    onClick={() => {
                      setProblemInput('')
                      setSolutionSteps(null)
                    }}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Xóa
                  </button>
                )}
              </div>

              <form onSubmit={handleSolve} className="space-y-3">
                <textarea
                  value={problemInput}
                  onChange={(e) => setProblemInput(e.target.value)}
                  placeholder={`Nhập đề bài môn ${subject.label} (hoặc bấm biểu tượng máy ảnh bên dưới để tải ảnh đề)...`}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-accent-500 leading-relaxed placeholder:text-zinc-500 resize-none shadow-inner"
                />

                {/* Khối xem trước ảnh đề bài nếu có */}
                {imagePreview && (
                  <div className="relative inline-block border border-indigo-500/40 rounded-2xl overflow-hidden bg-zinc-950 p-2">
                    <img
                      src={imagePreview}
                      alt="Đề bài chụp"
                      className="max-h-48 rounded-xl object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={buttonClass({
                        variant: 'outline',
                        size: 'sm',
                        className: 'tap-44',
                      })}
                    >
                      <Camera className="w-4 h-4 text-indigo-400 theme-light:text-indigo-800" />
                      <span>{imagePreview ? 'Đổi ảnh đề bài' : 'Chụp / Tải ảnh đề'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCalendarModalOpen(true)}
                      className={buttonClass({
                        variant: 'outline',
                        size: 'sm',
                        className: 'tap-44',
                      })}
                    >
                      <Calendar className="w-4 h-4 text-blue-400 theme-light:text-blue-800" />
                      <span>Lên lịch học Google</span>
                    </button>
                  </div>

                  <div>
                    {imagePreview ? (
                      <button
                        type="button"
                        onClick={handleVisionSolve}
                        disabled={solving}
                        className="tap-44 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-md active:scale-[0.98]"
                      >
                        {solving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>AI Vision đang giải…</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Giải từ ảnh chụp đề</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={solving || !problemInput.trim()}
                        className={buttonClass()}
                      >
                        {solving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>AI đang giải…</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Phân tích & Giải từng bước</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </section>

            {/* Kết quả lời giải từng bước */}
            {solutionSteps && (
              <section className="bg-zinc-900/90 border border-accent-500/30 rounded-3xl p-5 sm:p-6 space-y-4 animate-fade-in shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900" />
                    <h2 className="text-base font-bold text-white">
                      Lời Giải Chi Tiết Từng Bước (AI Step Analysis)
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      const fullText = solutionSteps
                        .map((s) => `${s.title}. ${s.detail}`)
                        .join('. ')
                      void speak(fullText, 'vi-VN')
                    }}
                    aria-label="Nghe đọc lời giải"
                    title="Nghe giọng đọc AI"
                    className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Đọc lời giải</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {solutionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800/80 space-y-2.5"
                    >
                      <h3 className="text-sm font-bold text-accent-300">{step.title}</h3>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {step.detail}
                      </p>
                      {step.formula && (
                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-amber-300 theme-light:text-amber-900 overflow-x-auto">
                          {step.formula}
                        </div>
                      )}
                      {step.socraticHint && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 theme-light:text-blue-800 text-xs">
                          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{step.socraticHint}</span>
                        </div>
                      )}
                      {step.pitfall && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 theme-light:text-amber-900 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{step.pitfall}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: CURRICULUM & FORMULAS */}
        {tab === 'curriculum' && currentGradeData && (
          <div className="space-y-4">
            {currentGradeData.chapters.map((chap, chapIdx) => (
              <div
                key={chap.id}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 space-y-4 transition shadow-sm animate-fade-up"
                style={{ animationDelay: `${chapIdx * 60}ms` }}
              >
                {/* Header chương với illustration nhỏ */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Số thứ tự chương */}
                    <div
                      className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${theme.accent} bg-zinc-950 border border-zinc-800`}
                    >
                      {String(chapIdx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-white leading-snug">
                        {chap.title}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {chap.description}
                      </p>
                    </div>
                  </div>
                  {/* Mini illustration theo môn học — chỉ hiện trên màn to */}
                  <div className="shrink-0 hidden md:block opacity-80">
                    <SubjectIllustration subjectId={subjectId ?? 'mathematics'} size="sm" />
                  </div>
                </div>

                {/* Danh sách công thức cốt lõi */}
                <div className="space-y-2">
                  <span className={`text-xs font-semibold ${theme.accent} block`}>
                    Công thức & Định lý cốt lõi:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {chap.keyFormulas.map((kf, i) => (
                      <div
                        key={i}
                        className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors group"
                      >
                        <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          {kf.name}
                        </p>
                        <p className="text-xs font-mono text-amber-300 theme-light:text-amber-900 bg-zinc-900/90 px-2.5 py-1.5 rounded-xl border border-zinc-800 overflow-x-auto">
                          {kf.formula}
                        </p>
                        {kf.note && (
                          <p className="text-[0.6875rem] text-zinc-400 italic">{kf.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PRACTICE PROBLEMS */}
        {tab === 'practice' && currentGradeData && (
          <div className="space-y-4">
            {/* Bộ lọc độ khó */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Độ khó:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'basic', label: 'Cơ bản' },
                { id: 'intermediate', label: 'Vận dụng' },
                { id: 'advanced', label: 'Vận dụng cao' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() =>
                    setDifficultyFilter(diff.id as 'all' | 'basic' | 'intermediate' | 'advanced')
                  }
                  className={`tap-44 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    difficultyFilter === diff.id
                      ? 'bg-accent-500 text-[#09090b] shadow-sm shadow-accent-500/20'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>

            {currentGradeData.chapters
              .flatMap((c) => c.sampleProblems)
              .filter((prob) => difficultyFilter === 'all' || prob.difficulty === difficultyFilter)
              .map((prob) => (
                <div
                  key={prob.id}
                  className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 space-y-3 transition shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase mr-2 border ${
                          prob.difficulty === 'basic'
                            ? 'bg-emerald-500/15 text-emerald-300 theme-light:text-emerald-900 border-emerald-500/30'
                            : prob.difficulty === 'intermediate'
                              ? 'bg-amber-500/15 text-amber-300 theme-light:text-amber-900 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 theme-light:text-rose-900 border-rose-500/30'
                        }`}
                      >
                        {prob.difficulty === 'basic'
                          ? 'Cơ bản'
                          : prob.difficulty === 'intermediate'
                            ? 'Vận dụng'
                            : 'Vận dụng cao'}
                      </span>
                      <h2 className="text-sm font-bold text-white inline">{prob.title}</h2>
                    </div>
                    <button
                      onClick={() => loadSampleProblem(prob.prompt, prob.solutionSteps)}
                      className={buttonClass({ size: 'sm', className: 'shrink-0 tap-44' })}
                    >
                      <span>Xem lời giải AI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80">
                    {prob.prompt}
                  </p>
                </div>
              ))}
          </div>
        )}
      </PageShell>

      <IntegrationsModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        itemType="study_schedule"
        itemData={{
          title: `Học ${subject.label} (${selectedGrade.replace('grade_', 'Lớp ')})`,
          description: `Phiên học và giải bài tập ${subject.label} trên Đồng Hành AI: ${window.location.href}`,
        }}
      />
    </div>
  )
}
