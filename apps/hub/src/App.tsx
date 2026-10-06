import { useState, useEffect } from 'react'
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  StickyNote,
  HeartHandshake,
  GraduationCap,
  Bot,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Users,
  Flame,
  User,
  Shield,
  Layers,
  MessageCircle,
  Code2,
  Languages,
} from 'lucide-react'
import { ThemeToggle } from '@core/ThemeToggle'
import HubLogin from './pages/HubLogin'
import { SUBJECT_CATALOG } from './subjectsCatalog.generated'

// Trang chủ hub — nền tảng "Đồng Hành Cùng Bạn" (https://www.donghanhcungban.org)
//
// LUẬT NỘI DUNG CỦA TRANG NÀY (chốt 2026-08-25, theo đặc tả kiến trúc platform
// `docs/research/kien-truc-va-ha-tang.md` mục [1]):
//   1. Trang chủ giới thiệu NỀN TẢNG DHCB — trụ Học tập + trụ Ghi chú + Companion
//      "Bạn Đồng Hành". KHÔNG đóng khung cả nền tảng thành "app học tiếng Anh".
//      [2026-09-20, quyết định chủ dự án] Ba trụ Sự nghiệp · Khởi nghiệp · Đời sống đã bị GỠ
//      HẲN khỏi sản phẩm, nên cũng không còn được giới thiệu ở đây — trang này chỉ nói về thứ
//      có thật. Nửa "Công việc" của trụ Work & Life cũ giữ lại dưới tên "Ghi chú".
//   2. Tiếng Anh là MỘT MÔN trong trụ Học tập — môn đầu tiên và chín nhất, đứng ngang hàng
//      với Lập trình và các môn đang xây.
//   3. Ngôn ngữ tuân theo tư thế đồng hành (`dong-hanh-va-phat-trien-nang-khieu-...`):
//      không xếp loại người dùng, không so sánh với người khác, không bảng điểm năng lực
//      trên trang chủ, không hứa điều nền tảng chưa làm được.
//   4. Ẩn số người dùng và lượt học với non-admin (chỉ admin thấy qua /api/hub-stats).

// URL app nền tảng. Tên biến mới là VITE_APP_URL; vẫn đọc VITE_ENGLISH_APP_URL để không
// phải sửa .env trên VPS ngay (tên cũ có từ thời nền tảng chỉ có môn tiếng Anh).
const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ||
  (import.meta.env.VITE_ENGLISH_APP_URL as string | undefined) ||
  'https://www.donghanhcungban.org'

const PROFILE_URL = `${APP_URL}/trang-ca-nhan`
const START_URL = `${APP_URL}/bat-dau`
const COMPANION_URL = `${APP_URL}/ban-dong-hanh`

interface HubStats {
  isAdmin?: boolean
  loggedIn?: boolean
  userName?: string
  totalUsers?: number
  totalEnglishSessions?: number
}

// ── Dữ liệu nội dung ─────────────────────────────────────────────────────────────

interface Pillar {
  id: string
  name: string
  icon: typeof BookOpen
  tagline: string
  description: string
  bullets: string[]
  url: string
}

// Các trụ của nền tảng. Mọi URL đều là route CÓ THẬT trong apps/dhcb (App.tsx) —
// không quảng cáo trang chưa tồn tại.
const PILLARS: Pillar[] = [
  {
    id: 'learning',
    name: 'Học tập',
    icon: GraduationCap,
    tagline: 'Hiểu, thực hành và ôn lại',
    description:
      'Góc học tập đa môn với gia sư AI riêng cho từng môn. Tiến độ, ôn tập ngắt quãng và lượt dùng đều nằm chung một hồ sơ, học môn nào cũng cộng dồn vào đó.',
    bullets: [
      'Tiếng Anh: hội thoại 2 chiều, phát âm, viết, lộ trình CEFR A1→C2',
      'Lập trình: Python · JavaScript/TypeScript · SQL, học tới sản phẩm chạy thật',
      'Toán · Lý · Hóa · Sinh đang hoàn thiện dần, đã xem trước và học thử được ngay',
    ],
    url: `${APP_URL}/goc-hoc-tap`,
  },
  {
    id: 'notes',
    name: 'Ghi chú',
    icon: StickyNote,
    tagline: 'Giữ lại câu hỏi, ý tưởng và việc đang học',
    description:
      'Lưu câu hỏi muốn tìm hiểu, ý tưởng dự án, tài liệu và việc cần làm. Ghi chú gắn với tài khoản và có thể cung cấp ngữ cảnh cho Bạn Đồng Hành khi trao đổi.',
    bullets: [
      'Việc cần làm trên bảng Kanban, kéo qua lại theo tiến độ',
      'Dự án, cuộc họp và tài liệu gắn cùng một hồ sơ',
      'Mỗi ghi chú tới 10.000 ký tự — đủ cho cả một biên bản họp',
      'Cần tài khoản để lưu ghi chú và liên kết ngữ cảnh',
    ],
    url: `${APP_URL}/ghi-chu`,
  },
]

interface Subject {
  id: string
  name: string
  emoji: string
  icon: typeof BookOpen
  status: 'live' | 'preview' | 'building'
  tagline: string
  description: string
  highlight: string
  skills: string[]
  ctaUrl?: string
  ctaLabel?: string
  /** Nút phụ "Bắt đầu với <môn>" — mọi môn 'live'/'preview' (AC-18); 'building' thì không. */
  startWithUrl?: string
}

/** Văn bản tiếp thị theo môn — CHỈ ở hub, không thuộc nguồn chung (spec S05-2 §①: "KHÔNG đưa
 *  văn bản tiếp thị của hub vào gói"). Id/nhãn/thứ tự/CTA/trạng thái đọc từ `SUBJECT_CATALOG`
 *  (sinh từ `packages/core-learner/subjectEntry.ts` — một nguồn cho hub và app). Test canh
 *  `Object.keys(SUBJECT_COPY)` khớp id của `SUBJECT_CATALOG` ở `subjectsCatalog.test.ts`. */
// Export chỉ để test canh (AC-16), không phải component — theo đúng khuôn
// packages/core-ui/ToastProvider.tsx:114.
// eslint-disable-next-line react-refresh/only-export-components
export const SUBJECT_COPY: Record<
  string,
  Pick<Subject, 'emoji' | 'icon' | 'tagline' | 'description' | 'highlight' | 'skills'>
> = {
  english: {
    emoji: '🇺🇸',
    icon: Languages,
    tagline: 'Gia sư AI hai chiều Việt ⇄ Anh · lộ trình CEFR A1 → C2',
    description:
      'Môn đầu tiên và chín nhất của nền tảng. AI trò chuyện bằng giọng Anh chuẩn, nhưng chỗ bạn sai thì được giảng lại bằng GIỌNG tiếng Việt — không chỉ hiện chữ.',
    highlight:
      'Hơn 12.000 từ vựng gắn nhãn cấp độ A1–C2, nhiều giọng đọc AI chất lượng cao, chấm bài viết theo tiêu chí IELTS, ôn tập ngắt quãng và học được cả khi mất mạng.',
    skills: [
      'Hội thoại phản xạ hai chiều Việt ⇄ Anh',
      'Luyện phát âm, đối chiếu theo phiên âm IPA',
      'Luyện viết, chấm theo tiêu chí kiểu IELTS',
      'Luyện nghe và đọc truyện song ngữ',
      'Ôn từ vựng ngắt quãng (SRS/FSRS)',
      'Học ngoại tuyến trên web và điện thoại (PWA)',
    ],
  },
  programming: {
    emoji: '💻',
    icon: Code2,
    tagline: 'Từ số 0 tới sản phẩm chạy thật · bậc P1 → P6',
    description:
      'Python, JavaScript/TypeScript và SQL, học quanh một dự án xuyên suốt. AI đọc code của bạn rồi hỏi lại để bạn tự tìm ra lỗi, thay vì đưa sẵn lời giải.',
    highlight:
      'Chạy thử code ngay trong trình duyệt, mỗi bài có mốc dự án cụ thể để bạn thấy thứ mình làm ra lớn dần.',
    skills: [
      'Đoán kết quả và đọc hiểu code có sẵn',
      'Sắp lại thứ tự dòng lệnh (Parsons)',
      'Tự viết code và chạy thử ngay trên web',
      'Mốc dự án thật sau mỗi chặng',
    ],
  },
  mathematics: {
    emoji: '📐',
    icon: BookOpen,
    tagline: 'Đại số · Hình học · Giải tích · Xác suất thống kê',
    description:
      'Các bài đang ở dạng xem trước, hoàn thiện dần: hướng dẫn cách nghĩ và từng bước giải, thay vì đưa thẳng đáp án.',
    highlight: 'Bài tập bám chương trình phổ thông; phần đại học sẽ mở dần sau.',
    skills: [
      'Giải từng bước kèm lý do cho mỗi bước',
      'Đồ thị và hình học trực quan',
      'Ôn theo dạng bài của kỳ thi',
    ],
  },
  physics: {
    emoji: '⚛️',
    icon: BookOpen,
    tagline: 'Cơ · Nhiệt · Điện từ · Quang · Vật lý hiện đại',
    description:
      'Các bài đang ở dạng xem trước, hoàn thiện dần: hiểu bản chất hiện tượng trước, rồi mới đến công thức và bài tập định lượng.',
    highlight: 'Mô phỏng tương tác để nhìn thấy hiện tượng chứ không chỉ đọc công thức.',
    skills: [
      'Mô phỏng thí nghiệm ảo',
      'Phương pháp giải theo từng dạng bài',
      'Đọc và phân tích đồ thị',
    ],
  },
  chemistry: {
    emoji: '🧪',
    icon: BookOpen,
    tagline: 'Vô cơ · Hữu cơ · Oxi hóa khử · Phân tích',
    description:
      'Các bài đang ở dạng xem trước, hoàn thiện dần: viết và cân bằng phương trình, đọc cơ chế phản ứng, giải bài toán hóa học theo lối tư duy.',
    highlight: 'Trực quan hóa cấu trúc phân tử và chuỗi phản ứng.',
    skills: [
      'Viết và cân bằng phương trình',
      'Chuỗi phản ứng, nhận biết chất',
      'Bài toán định lượng',
    ],
  },
  biology: {
    emoji: '🧬',
    icon: BookOpen,
    tagline: 'Di truyền · Tế bào · Tiến hóa · Sinh thái',
    description:
      'Các bài đang ở dạng xem trước, hoàn thiện dần: hệ thống kiến thức theo sơ đồ và cơ chế, kèm bài tập di truyền có hướng dẫn lập luận.',
    highlight: 'Sơ đồ tư duy và phương pháp giải bài tập di truyền, phả hệ.',
    skills: ['Quy luật di truyền và phả hệ', 'Cơ chế di truyền phân tử', 'Sinh thái và môi trường'],
  },
}

// Môn học trong trụ Học tập — MỘT NGUỒN với app: id/nhãn/thứ tự/ctaPath/trạng thái đọc từ file
// sinh `subjectsCatalog.generated.ts` (nguồn thật: packages/core-learner/subjectEntry.ts), ghép
// với văn bản tiếp thị `SUBJECT_COPY` ở trên (S05-2, Q5: 4 môn STEM nay 'preview' — có bài xem
// trước thật, không còn 'building' như trước — english/programming 'live').
const SUBJECTS: Subject[] = SUBJECT_CATALOG.map((entry) => {
  const copy = SUBJECT_COPY[entry.id]
  if (!copy) throw new Error(`Thiếu văn bản tiếp thị SUBJECT_COPY cho môn "${entry.id}"`)
  const isBuilding = entry.status === 'building'
  return {
    id: entry.id,
    name: entry.label,
    status: entry.status,
    ...copy,
    ctaUrl: entry.status === 'live' ? `${APP_URL}${entry.ctaPath}` : undefined,
    ctaLabel: entry.status === 'live' ? `Vào học ${entry.label}` : undefined,
    startWithUrl: isBuilding ? undefined : `${APP_URL}/bat-dau?mon=${entry.id}`,
  }
})

function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN')
}

function useHubStats() {
  const [stats, setStats] = useState<HubStats | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/hub-stats', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: HubStats | null) => {
        if (!cancelled && data) setStats(data)
      })
      .catch(() => {
        // Fail-open: trang chủ vẫn hiển thị đầy đủ khi API lỗi.
      })
    return () => {
      cancelled = true
    }
  }, [])
  return stats
}

// ── Header / Navigation ──────────────────────────────────────────────────────────
function Navbar({ stats }: { stats: HubStats | null }) {
  const isLoggedIn = !!stats?.loggedIn
  const displayName = stats?.userName?.trim()

  const navLinks = [
    { href: '#tru-cot', label: 'Các trụ' },
    { href: '#companion', label: 'Bạn Đồng Hành' },
    { href: '#mon-hoc', label: 'Môn học' },
    { href: '#cach-hoat-dong', label: 'Cách hoạt động' },
    { href: '#bang-gia', label: 'Bảng giá' },
    { href: '#hoi-dap', label: 'Hỏi đáp' },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/85 border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* aria-label: dưới 560px chữ thương hiệu ẩn đi (nhường chỗ cho cụm nút bên phải, tránh
            tràn ngang ở 320/390px — audit 2026-09-30 C6) nên liên kết cần tên đọc được riêng
            (WCAG 2.4.4/4.1.2, axe link-name). */}
        <a
          href="/"
          aria-label="Đồng Hành Cùng Bạn — trang chủ"
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-500 to-accent-400 flex items-center justify-center shadow-lg shadow-accent-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-[#09090b]" />
          </div>
          <div className="hidden min-[560px]:flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
              Đồng Hành Cùng Bạn
              <span className="hidden md:inline text-[0.6875rem] uppercase font-semibold px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-300 theme-light:text-accent-800 border border-accent-500/25">
                Nền tảng
              </span>
            </span>
            <span className="text-[0.6875rem] text-zinc-300 hidden sm:inline">
              Học tập · Ghi chú · Bạn Đồng Hành
            </span>
          </div>
        </a>

        <nav
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-5 text-sm font-medium text-zinc-200"
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:text-accent-300 theme-light:hover:text-accent-800 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle lang="vi" />
          {isLoggedIn ? (
            <>
              <a
                href={PROFILE_URL}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-100 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition"
                title="Trang cá nhân & quản lý tài khoản"
              >
                <User className="w-3.5 h-3.5 text-accent-300 theme-light:text-accent-800" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {displayName || 'Trang cá nhân'}
                </span>
              </a>
              <a
                href={APP_URL}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 sm:px-3.5 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#09090b] shadow-md shadow-accent-500/20 transition-all hover:scale-[1.02]"
              >
                <span>Vào nền tảng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="text-xs sm:text-sm font-medium text-zinc-200 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition"
              >
                Đăng nhập
              </a>
              <a
                href={START_URL}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#09090b] shadow-md shadow-accent-500/20 hover:shadow-accent-500/30 transition-all hover:scale-[1.02]"
              >
                <span>Bắt đầu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────────
function Hero({ stats }: { stats: HubStats | null }) {
  const isLoggedIn = !!stats?.loggedIn
  const displayName = stats?.userName?.trim()

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-20 px-4 sm:px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-accent-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-10 right-10 w-[300px] h-[250px] bg-accent-400/10 blur-[100px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-4xl mx-auto text-center">
        {isLoggedIn ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/40 text-xs sm:text-sm text-accent-200 theme-light:text-accent-900 mb-6 shadow-sm">
            <span aria-hidden="true">👋</span>
            <span className="font-semibold">
              Chào bạn quay lại{displayName ? `, ${displayName}` : ''}
            </span>
            <span aria-hidden="true" className="text-accent-500">
              •
            </span>
            <a href={PROFILE_URL} className="underline hover:text-white transition">
              Trang cá nhân
            </a>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-200 mb-6 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-accent-300 theme-light:text-accent-800" />
            <span className="font-semibold text-accent-300 theme-light:text-accent-800">
              Học hỏi cho mọi người
            </span>
            <span aria-hidden="true" className="text-zinc-500">
              •
            </span>
            <span className="text-zinc-200">Bắt đầu từ một việc nhỏ</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
          Học điều bạn muốn. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-accent-400 via-accent-300 to-accent-200 bg-clip-text text-transparent">
            Hiểu điều bạn học.
          </span>{' '}
          Từng bước tự học tốt hơn.
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-zinc-200 max-w-2xl mx-auto mb-8 leading-relaxed">
          Bài học, thực hành, ghi chú và AI hỗ trợ bạn khám phá kiến thức, hiểu cách làm và tự tin
          học tiếp. Bạn chọn mục tiêu, bắt đầu từ một việc vừa sức và tiến bộ theo nhịp của mình.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <a
            href={isLoggedIn ? APP_URL : START_URL}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#09090b] font-bold text-base shadow-lg shadow-accent-500/25 hover:shadow-accent-500/35 transition-all hover:scale-[1.02]"
          >
            <span>{isLoggedIn ? 'Tiếp tục việc đang làm' : 'Bắt đầu học miễn phí'}</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="#tru-cot"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-semibold text-base transition"
          >
            <Layers className="w-4 h-4 text-accent-300 theme-light:text-accent-800" />
            <span>Nền tảng gồm những gì?</span>
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 border-t border-zinc-800/60 text-xs sm:text-sm text-zinc-200">
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-900/40">
            <CheckCircle2 className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0" />
            <span>Thử ngay không cần đăng nhập</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-900/40">
            <Smartphone className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0" />
            <span>Web &amp; điện thoại (PWA)</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-900/40">
            <Bot className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0" />
            <span>AI hỗ trợ, bạn quyết định</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-900/40">
            <ShieldCheck className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0" />
            <span>Dữ liệu của bạn, bạn quyết</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Dải số liệu nền tảng ─────────────────────────────────────────────────────────
// Admin: số người dùng + lượt học thật. Người khác: mốc mô tả nền tảng, KHÔNG phải
// điểm số của người dùng (luật "không bảng chấm điểm trên trang chủ").
function ActivitySection({ stats }: { stats: HubStats | null }) {
  const isAdmin = stats?.isAdmin === true
  const hasAdminStats =
    isAdmin && stats.totalUsers !== undefined && stats.totalEnglishSessions !== undefined

  return (
    <section className="px-4 sm:px-6 py-8 bg-zinc-900/40 border-y border-zinc-800/80">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-xs uppercase tracking-widest text-accent-300 theme-light:text-accent-800 font-bold">
              {isAdmin ? 'Thống kê hoạt động nền tảng' : 'Nền tảng hiện có gì'}
            </h2>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[0.6875rem] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 theme-light:text-amber-900 border border-amber-500/30 font-semibold">
                <Shield className="w-2.5 h-2.5" />
                Admin
              </span>
            )}
          </div>
          <p className="text-zinc-200 text-xs sm:text-sm">
            {isAdmin
              ? 'Số liệu quản trị, chỉ admin nhìn thấy'
              : 'Nói đúng những gì đang chạy được — phần đang xây ghi rõ là đang xây'}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {hasAdminStats ? (
            <>
              <div className="bg-zinc-900/80 rounded-xl p-4 sm:p-5 border border-zinc-800 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-accent-300 theme-light:text-accent-800 tracking-tight">
                  {formatNumber(stats.totalUsers!)}
                </div>
                <div className="text-xs sm:text-sm text-zinc-200 mt-1 flex items-center justify-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Người dùng tham gia</span>
                </div>
              </div>
              <div className="bg-zinc-900/80 rounded-xl p-4 sm:p-5 border border-zinc-800 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-accent-300 theme-light:text-accent-800 tracking-tight">
                  {formatNumber(stats.totalEnglishSessions!)}
                </div>
                <div className="text-xs sm:text-sm text-zinc-200 mt-1 flex items-center justify-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Lượt học môn Tiếng Anh</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-zinc-900/80 rounded-xl p-4 sm:p-5 border border-zinc-800 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-accent-300 theme-light:text-accent-800 tracking-tight">
                  2 trụ
                </div>
                <div className="text-xs sm:text-sm text-zinc-200 mt-1 flex items-center justify-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Học tập · Ghi chú</span>
                </div>
              </div>
              <div className="bg-zinc-900/80 rounded-xl p-4 sm:p-5 border border-zinc-800 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-accent-300 theme-light:text-accent-800 tracking-tight">
                  2 môn
                </div>
                <div className="text-xs sm:text-sm text-zinc-200 mt-1 flex items-center justify-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Đang học được: Tiếng Anh &amp; Lập trình</span>
                </div>
              </div>
            </>
          )}

          <div className="bg-zinc-900/80 rounded-xl p-4 sm:p-5 border border-zinc-800 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-accent-300 theme-light:text-accent-800 tracking-tight">
              12.000+
            </div>
            <div className="text-xs sm:text-sm text-zinc-200 mt-1 flex items-center justify-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-zinc-300" />
              <span>Từ vựng Anh gắn nhãn A1–C2</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 rounded-xl p-4 sm:p-5 border border-zinc-800 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-accent-300 theme-light:text-accent-800 tracking-tight">
              1 hồ sơ
            </div>
            <div className="text-xs sm:text-sm text-zinc-200 mt-1 flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-300" />
              <span>Dùng chung cho mọi trụ, mọi môn</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Các trụ ──────────────────────────────────────────────────────────────────────
function PillarsSection() {
  return (
    <section id="tru-cot" className="px-4 sm:px-6 py-16 sm:py-20 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs uppercase font-bold tracking-widest text-accent-300 theme-light:text-accent-800 mb-2 block">
          Hỗ trợ quá trình học
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Không chỉ học thêm — học tốt hơn
        </h2>
        <p className="text-zinc-200 text-sm sm:text-base">
          Tìm điểm bắt đầu, hiểu cách làm, thực hành và ôn lại điều cần củng cố. Ghi chú giữ lại câu
          hỏi và ý tưởng; AI giúp trao đổi và phản hồi, không học thay bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PILLARS.map((p) => {
          const Icon = p.icon
          return (
            <article
              key={p.id}
              className="bg-zinc-900/70 hover:bg-zinc-900 rounded-2xl p-6 border border-zinc-800 hover:border-accent-500/40 transition-all flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-accent-300 theme-light:text-accent-800" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
              <p className="text-accent-300 theme-light:text-accent-800 text-sm font-medium mb-3">
                {p.tagline}
              </p>
              <p className="text-zinc-200 text-sm leading-relaxed mb-4">{p.description}</p>
              <ul className="space-y-2 mb-5 flex-1">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a
                href={p.url}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 theme-light:text-accent-800 hover:text-white transition"
              >
                <span>Xem trụ {p.name}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </article>
          )
        })}

        {/* Thẻ cuối: Companion — thứ nối các trụ lại với nhau */}
        <article className="bg-gradient-to-br from-accent-500/10 to-zinc-900 rounded-2xl p-6 border border-accent-500/40 flex flex-col">
          <div className="w-12 h-12 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-accent-200 theme-light:text-accent-900" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Bạn Đồng Hành</h3>
          <p className="text-accent-200 theme-light:text-accent-900 text-sm font-medium mb-3">
            Sợi chỉ xuyên suốt cả nền tảng
          </p>
          <p className="text-zinc-100 text-sm leading-relaxed mb-4 flex-1">
            Một nơi để hỏi khi chưa rõ, trao đổi về điều đang học và cân nhắc bước tiếp theo. AI có
            thể dùng ngữ cảnh liên quan; bạn vẫn là người suy nghĩ và quyết định. Bạn Đồng Hành cần
            tài khoản.
          </p>
          <a
            href={COMPANION_URL}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-200 theme-light:text-accent-900 hover:text-white transition"
          >
            <span>Gặp Bạn Đồng Hành</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </article>
      </div>
    </section>
  )
}

// ── Companion: tư thế đồng hành ──────────────────────────────────────────────────
// Nội dung dịch từ 8 luật hành xử (docs/research/dong-hanh-va-phat-trien-nang-khieu).
function CompanionSection() {
  const promises = [
    {
      title: 'Bạn chốt, mình đề xuất',
      desc: 'Mục tiêu là của bạn. Companion đưa ra lựa chọn kèm lý do, không ra lệnh "hôm nay bạn phải…".',
    },
    {
      title: 'Hỏi trước khi khuyên',
      desc: 'Hiểu hoàn cảnh của bạn rồi mới nói. Một lời khuyên đúng lý thuyết mà lệch hoàn cảnh thì vô dụng.',
    },
    {
      title: 'Bắt đầu từ một việc nhỏ',
      desc: 'Gợi ý một việc để bắt đầu, có lựa chọn khác khi chưa phù hợp. Không cần lên kế hoạch cho cả chặng đường ngay từ đầu.',
    },
    {
      title: 'So với chính bạn hôm qua',
      desc: 'Không bảng xếp hạng, không so bạn với người khác, không "đáng lẽ tuổi này bạn phải…".',
    },
    {
      title: 'Gián đoạn là chuyện bình thường',
      desc: 'Nghỉ hai tuần rồi quay lại vẫn được chào đón như thường. Không trách móc, không tính sổ.',
    },
    {
      title: 'Biết giới hạn của mình',
      desc: 'Chuyện y tế, tâm lý lâm sàng, pháp lý hay đầu tư — Companion nói thẳng là ngoài tầm và chỉ bạn sang người thật.',
    },
  ]

  return (
    <section
      id="companion"
      className="px-4 sm:px-6 py-16 sm:py-20 bg-zinc-900/30 border-t border-zinc-800"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-accent-300 theme-light:text-accent-800 mb-2 block">
            Bạn Đồng Hành
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Một người bạn, không phải một huấn luyện viên khắc nghiệt
          </h2>
          <p className="text-zinc-200 text-sm sm:text-base">
            Thước đo thành công của nền tảng là bạn tiến bộ ngoài đời thật — không phải số phút bạn
            ở lại trong ứng dụng. Sáu cam kết dưới đây là ràng buộc thiết kế, không phải khẩu hiệu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {promises.map((p) => (
            <div
              key={p.title}
              className="bg-zinc-900/70 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <HeartHandshake className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0" />
                <h3 className="text-base font-bold text-white">{p.title}</h3>
              </div>
              <p className="text-zinc-200 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={COMPANION_URL}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-accent-500/30 text-zinc-100 font-semibold text-sm transition"
          >
            <MessageCircle className="w-4 h-4 text-accent-300 theme-light:text-accent-800" />
            <span>Trò chuyện với Bạn Đồng Hành</span>
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Môn học (trong trụ Học tập) ──────────────────────────────────────────────────
function SubjectsSection() {
  const [active, setActive] = useState(SUBJECTS[0]!.id)
  const current = SUBJECTS.find((s) => s.id === active)!

  return (
    <section id="mon-hoc" className="px-4 sm:px-6 py-16 sm:py-20 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs uppercase font-bold tracking-widest text-accent-300 theme-light:text-accent-800 mb-2 block">
          Bên trong trụ Học tập
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Các môn học — cùng một khuôn
        </h2>
        <p className="text-zinc-200 text-sm sm:text-base">
          Mỗi môn có gia sư AI, lộ trình và cách chấm riêng, nhưng dùng chung hồ sơ, tiến độ và gói
          tài khoản. Tiếng Anh là môn đầu tiên và chín nhất; Lập trình đã học được; Toán · Lý · Hóa
          · Sinh đang hoàn thiện dần, đã xem trước và học thử được ngay.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Chọn môn học"
        className="flex gap-2 justify-center flex-wrap mb-8"
      >
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`tab-${s.id}`}
            aria-selected={active === s.id}
            aria-controls={`panel-${s.id}`}
            onClick={() => setActive(s.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              active === s.id
                ? 'bg-accent-500 text-[#09090b] shadow-lg shadow-accent-500/20 scale-105'
                : 'bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <span aria-hidden="true">{s.emoji}</span>
            <span>{s.name}</span>
            {s.status === 'live' ? (
              <span
                className={`text-[0.6875rem] px-1.5 py-0.5 rounded font-semibold ${
                  active === s.id
                    ? 'bg-[#09090b]/15 text-[#09090b]'
                    : 'bg-accent-500/15 text-accent-200 theme-light:text-accent-800 border border-accent-500/25'
                }`}
              >
                Học được
              </span>
            ) : s.status === 'preview' ? (
              <span
                className={`text-[0.6875rem] px-1.5 py-0.5 rounded ${
                  active === s.id
                    ? 'bg-[#09090b]/15 text-[#09090b]'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                Xem trước được
              </span>
            ) : (
              <span
                className={`text-[0.6875rem] px-1.5 py-0.5 rounded ${
                  active === s.id
                    ? 'bg-[#09090b]/15 text-[#09090b]'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                Đang xây
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="bg-zinc-900/90 rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-3xl" aria-hidden="true">
            {current.emoji}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{current.name}</h3>
          {current.status === 'live' ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent-500/10 text-accent-200 theme-light:text-accent-900 font-semibold border border-accent-500/30">
              Đang học được
            </span>
          ) : current.status === 'preview' ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
              Đang hoàn thiện — xem trước được
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
              Đang được xây
            </span>
          )}
        </div>

        <p className="text-accent-300 theme-light:text-accent-800 font-medium text-sm sm:text-base mb-3">
          {current.tagline}
        </p>
        <p className="text-zinc-100 text-sm sm:text-base leading-relaxed mb-5">
          {current.description}
        </p>

        <div className="mt-2 mb-6">
          <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">
            Bạn làm được gì trong môn này
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {current.skills.map((skill) => (
              <div key={skill} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-100">
                <CheckCircle2 className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0 mt-0.5" />
                <span>{skill}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-200 border-t border-zinc-800/80 pt-4 mb-6">
          <span aria-hidden="true">💡</span> {current.highlight}
        </p>

        {current.status === 'live' && current.ctaUrl ? (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={current.ctaUrl}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#09090b] font-bold text-sm sm:text-base transition-all shadow-md shadow-accent-500/20 hover:scale-[1.02]"
            >
              <span>{current.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            {current.startWithUrl ? (
              <a
                href={current.startWithUrl}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 theme-light:text-accent-800 hover:text-white transition"
              >
                <span>Bắt đầu với {current.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : null}
            <span className="text-xs text-zinc-200">
              Có lượt dùng miễn phí mỗi ngày • Không cần thẻ
            </span>
          </div>
        ) : current.startWithUrl ? (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={current.startWithUrl}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#09090b] font-bold text-sm sm:text-base transition-all shadow-md shadow-accent-500/20 hover:scale-[1.02]"
            >
              <span>Bắt đầu với {current.name}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-xs text-zinc-200">
              Bài đang hoàn thiện dần — xem trước được ngay, chưa cần trả phí
            </span>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-zinc-200">
            Môn này chưa mở để học. Khi mở, tài khoản hiện tại của bạn dùng được ngay, không phải
            mua thêm.
          </p>
        )}
      </div>

      <div className="mt-8 text-center">
        <a
          href={`${APP_URL}/goc-hoc-tap`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 theme-light:text-accent-800 hover:text-white transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Xem phòng học đa môn</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  )
}

// ── Cách hoạt động ───────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      n: '1',
      title: 'Vài câu hỏi ngắn, khoảng 90 giây',
      desc: 'Bạn đang bận tâm chuyện gì, muốn hướng nào, có bao nhiêu thời gian. Không bài kiểm tra, không chấm điểm, không xếp loại bạn.',
    },
    {
      n: '2',
      title: 'Companion gợi ý đúng một việc',
      desc: 'Một việc nhỏ đủ để bắt đầu ngay hôm nay, kèm hai lựa chọn khác và luôn có đường "để mình chọn thứ khác". Bạn là người chốt.',
    },
    {
      n: '3',
      title: 'Làm, rồi điều chỉnh dần',
      desc: 'Bạn làm việc đó ở đúng trụ tương ứng. Companion học thêm về hoàn cảnh của bạn qua chính việc bạn làm, nên gợi ý sau sát hơn gợi ý trước.',
    },
  ]

  return (
    <section
      id="cach-hoat-dong"
      className="px-4 sm:px-6 py-16 sm:py-20 bg-zinc-900/30 border-t border-zinc-800"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-accent-300 theme-light:text-accent-800 mb-2 block">
            Bắt đầu thế nào
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Ba bước, không có bài kiểm tra đầu vào
          </h2>
          <p className="text-zinc-200 text-sm sm:text-base">
            Nền tảng không mở đầu bằng một bảng chấm điểm con người. Nó mở đầu bằng một việc bạn làm
            được ngay hôm nay.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <li
              key={s.n}
              className="bg-zinc-900/70 rounded-2xl p-6 border border-zinc-800 relative flex flex-col"
            >
              <div className="w-10 h-10 rounded-full bg-accent-500 text-[#09090b] font-extrabold flex items-center justify-center mb-4 text-lg">
                {s.n}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-zinc-200 text-sm leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <a
            href={START_URL}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#09090b] font-bold text-base shadow-lg shadow-accent-500/25 transition-all hover:scale-[1.02]"
          >
            <span>Bắt đầu ngay</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Bảng giá ─────────────────────────────────────────────────────────────────────
function PricingSection({ stats }: { stats: HubStats | null }) {
  const isLoggedIn = !!stats?.loggedIn

  return (
    <section id="bang-gia" className="px-4 sm:px-6 py-16 sm:py-20 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-xs uppercase font-bold tracking-widest text-accent-300 theme-light:text-accent-800 mb-2 block">
          Bảng giá
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Một tài khoản cho cả nền tảng
        </h2>
        <p className="text-zinc-200 text-sm sm:text-base">
          Bắt đầu miễn phí để trải nghiệm cách học. Nâng cấp VIP khi cần tự chọn thứ tự bài và sử
          dụng AI không giới hạn lượt trong thời gian gói còn hiệu lực.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Gói Miễn phí</h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200">
                Không giới hạn thời gian
              </span>
            </div>
            <div className="mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">0đ</span>
              <span className="text-zinc-200 text-xs sm:text-sm"> / mãi mãi</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 mb-6">
              Dùng được cả nền tảng với một số lượt gọi AI mỗi ngày, để nhiều người cùng dùng được.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-100 mb-8">
              {[
                'Thử nội dung học không cần đăng nhập; AI dùng thử có hạn mức',
                'Học Tiếng Anh và Lập trình với lượt AI hằng ngày',
                'Trọn lộ trình CEFR A1 → C2 và từ điển',
                'Ôn tập ngắt quãng, học ngoại tuyến trên điện thoại',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <a
            href={isLoggedIn ? APP_URL : START_URL}
            className="w-full py-3 px-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-center font-semibold text-sm text-white transition block"
          >
            {isLoggedIn ? 'Vào nền tảng' : 'Dùng thử miễn phí'}
          </a>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-accent-500/10 rounded-2xl p-6 sm:p-8 border-2 border-accent-500/60 shadow-xl shadow-accent-500/10 flex flex-col justify-between relative">
          <div className="absolute -top-3 right-6 bg-accent-500 text-[#09090b] font-bold text-[0.6875rem] uppercase tracking-wider px-3 py-0.5 rounded-full shadow">
            Khuyên dùng
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Gói VIP</span>
                <Sparkles className="w-4 h-4 text-accent-300 theme-light:text-accent-800" />
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-accent-500/10 text-accent-200 theme-light:text-accent-900 font-semibold border border-accent-500/20">
                Cả nền tảng
              </span>
            </div>
            <div className="mb-6">
              <span className="text-3xl sm:text-4xl font-extrabold text-accent-300 theme-light:text-accent-800">
                Học tự do
              </span>
              <span className="text-zinc-200 text-xs sm:text-sm"> / 10 ngày · tháng · năm</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-100 mb-6">
              Tự chọn bài trong nội dung đã mở và không giới hạn lượt AI trong thời gian gói có hiệu
              lực. Xem giá theo thời hạn trước khi thanh toán. Các kiểm soát an toàn, chống lạm dụng
              và gián đoạn kỹ thuật vẫn áp dụng.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-100 mb-8">
              {[
                'Không giới hạn lượt AI/ngày khi gói còn hiệu lực',
                'Tự do chọn thứ tự bài, không phải học lại chỉ để mở khóa',
                'Hỏi, nhận phản hồi và luyện tập theo nhu cầu',
                'Quyền mở bài không thay thế việc thực hành và tự đánh giá',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <a
            href={isLoggedIn ? PROFILE_URL : `${APP_URL}/login`}
            className="w-full py-3.5 px-4 rounded-xl bg-accent-500 hover:bg-accent-400 text-center font-bold text-sm text-[#09090b] shadow-md shadow-accent-500/25 transition block hover:scale-[1.02]"
          >
            {isLoggedIn ? 'Xem giá & nâng cấp trong hồ sơ →' : 'Đăng nhập để xem bảng giá →'}
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Hỏi đáp ──────────────────────────────────────────────────────────────────────
function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const faqs = [
    {
      q: 'Đồng Hành Cùng Bạn hỗ trợ việc học như thế nào?',
      a: 'Nền tảng giúp bạn tìm điểm bắt đầu, khám phá kiến thức, thực hành, ôn lại và theo dõi tiến độ. Mục tiêu không chỉ là học thêm nhiều kiến thức, mà là từng bước nâng cao khả năng tự học. AI hỗ trợ giải thích và phản hồi; bạn vẫn là người suy nghĩ và quyết định.',
    },
    {
      q: 'Tôi có phải đăng ký trước khi dùng không?',
      a: 'Không. Bạn có thể bắt đầu với nội dung học và các hoạt động được mở cho khách. AI dùng thử có hạn mức. Tiến độ khách lưu trên trình duyệt này; tạo tài khoản khi cần đồng bộ, dùng Ghi chú, Bạn Đồng Hành hoặc quản lý gói dịch vụ.',
    },
    {
      q: 'Hiện tại những môn nào đã mở?',
      a: 'Tiếng Anh và Lập trình đang học được. Toán, Vật lý, Hóa học và Sinh học có nội dung xem trước và đang hoàn thiện. Các môn không có cùng mức độ hoàn thiện; trạng thái được ghi rõ ở phần môn học.',
    },
    {
      q: 'Tôi đã biết cơ bản, có phải học lại từ đầu không?',
      a: 'VIP cho phép tự chọn thứ tự bài trong nội dung đã mở; các cấp tiếng Anh và bậc lập trình được mở mà không bắt học lại chỉ để mở khóa. Lộ trình vẫn là gợi ý. Quyền mở bài không có nghĩa là đã thành thạo; bạn vẫn có thể luyện tập và tự kiểm tra.',
    },
    {
      q: 'Miễn phí và VIP khác nhau thế nào?',
      a: 'Miễn phí có hạn mức AI để làm quen và học tập. VIP cho phép tự chọn bài và không giới hạn lượt AI trong thời gian gói còn hiệu lực. Không giới hạn lượt không có nghĩa mọi nội dung tương lai đã có sẵn, truy cập vĩnh viễn sau một lần mua hoặc bỏ các kiểm soát an toàn, chống lạm dụng.',
    },
    {
      q: 'AI có luôn đưa ra đáp án đúng không?',
      a: 'Không. Phản hồi AI có thể sai. Hãy dùng lời giải thích như hỗ trợ để suy nghĩ và kiểm tra lại. Điểm luyện viết kiểu IELTS chỉ là ước lượng tham khảo, không phải kết quả thi hay chứng nhận chính thức.',
    },
    {
      q: 'Cài lên điện thoại thế nào?',
      a: 'Mở website bằng Safari trên iPhone hoặc Chrome trên Android rồi chọn Thêm vào Màn hình chính. Một số nội dung ôn tập đã lưu có thể dùng ngoại tuyến; tính năng gọi AI vẫn cần Internet.',
    },
  ]

  return (
    <section
      id="hoi-dap"
      className="px-4 sm:px-6 py-16 sm:py-20 max-w-4xl mx-auto border-t border-zinc-800"
    >
      <div className="text-center mb-12">
        <span className="text-xs uppercase font-bold tracking-widest text-accent-300 theme-light:text-accent-800 mb-2 block">
          Giải đáp thắc mắc
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Câu hỏi thường gặp
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx
          return (
            <div
              key={faq.q}
              className="bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${idx}`}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-zinc-100 hover:text-white"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-accent-300 theme-light:text-accent-800 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-300 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div
                  id={`faq-panel-${idx}`}
                  className="px-5 pb-4 text-xs sm:text-sm text-zinc-200 leading-relaxed border-t border-zinc-800/50 pt-3"
                >
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── CTA cuối trang ───────────────────────────────────────────────────────────────
function CtaBanner({ stats }: { stats: HubStats | null }) {
  const isLoggedIn = !!stats?.loggedIn

  return (
    <section className="px-4 sm:px-6 py-14 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-accent-500/15 via-zinc-900 to-zinc-900 border border-accent-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-200 theme-light:text-accent-900 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bắt đầu từ một việc nhỏ</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Việc nhỏ hôm nay, đường dài có bạn đi cùng
          </h2>
          <p className="text-zinc-100 text-sm sm:text-base mb-8 leading-relaxed">
            Không cần biết trước mình muốn gì. Trả lời vài câu ngắn, rồi làm đúng một việc — phần
            còn lại tính sau.
          </p>
          <a
            href={isLoggedIn ? APP_URL : START_URL}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent-500 hover:bg-accent-400 text-[#09090b] font-bold text-base shadow-lg shadow-accent-500/25 transition-all hover:scale-105"
          >
            <span>{isLoggedIn ? 'Tiếp tục việc đang làm' : 'Bắt đầu miễn phí'}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────────
function Footer({ stats }: { stats: HubStats | null }) {
  const isLoggedIn = !!stats?.loggedIn

  return (
    <footer className="px-4 sm:px-6 py-12 bg-zinc-950 border-t border-zinc-800/80 text-zinc-200 text-xs">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-accent-300 theme-light:text-accent-800" />
            <span>Đồng Hành Cùng Bạn</span>
          </div>
          <p className="text-zinc-200 text-xs leading-relaxed max-w-sm">
            Hỗ trợ mọi người học hỏi, hiểu sâu hơn và từng bước nâng cao khả năng tự học. Bài học,
            thực hành, ghi chú và AI đồng hành. donghanhcungban.org
          </p>
        </div>

        <nav aria-label="Các trụ" className="flex flex-col gap-2">
          <h2 className="text-zinc-100 font-semibold text-xs uppercase tracking-wider mb-1">
            Các trụ
          </h2>
          {PILLARS.map((p) => (
            <a
              key={p.id}
              href={p.url}
              className="hover:text-accent-300 theme-light:hover:text-accent-800 transition"
            >
              {p.name}
            </a>
          ))}
        </nav>

        <nav aria-label="Liên kết khác" className="flex flex-col gap-2">
          <h2 className="text-zinc-100 font-semibold text-xs uppercase tracking-wider mb-1">
            Liên kết
          </h2>
          <a
            href={COMPANION_URL}
            className="hover:text-accent-300 theme-light:hover:text-accent-800 transition"
          >
            Bạn Đồng Hành
          </a>
          <a
            href={`${APP_URL}/goc-hoc-tap`}
            className="hover:text-accent-300 theme-light:hover:text-accent-800 transition"
          >
            Góc học tập đa môn
          </a>
          <a
            href={`${APP_URL}/gioi-thieu`}
            className="hover:text-accent-300 theme-light:hover:text-accent-800 transition"
          >
            Giới thiệu nền tảng
          </a>
          {isLoggedIn && (
            <a
              href={PROFILE_URL}
              className="hover:text-accent-300 theme-light:hover:text-accent-800 transition"
            >
              Trang cá nhân
            </a>
          )}
          <a
            href="mailto:donghanhcungban.org@gmail.com"
            className="hover:text-accent-300 theme-light:hover:text-accent-800 transition"
          >
            Liên hệ hỗ trợ
          </a>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-300">
        <p>© 2026 Đồng Hành Cùng Bạn.</p>
        <p>Làm cho người Việt — miễn phí ở mức đủ dùng, trả phí khi cần nhiều hơn.</p>
      </div>
    </footer>
  )
}

// ── Router tối giản ──────────────────────────────────────────────────────────────
function useCurrentPath(): string {
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/')

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  return path
}

export default function App() {
  const path = useCurrentPath()
  const stats = useHubStats()

  if (path === '/login' || path.startsWith('/login/')) {
    return <HubLogin />
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-accent-500/30 selection:text-accent-200">
      <Navbar stats={stats} />
      <main className="flex-1">
        <Hero stats={stats} />
        <ActivitySection stats={stats} />
        <PillarsSection />
        <CompanionSection />
        <SubjectsSection />
        <HowItWorksSection />
        <PricingSection stats={stats} />
        <FaqSection />
        <CtaBanner stats={stats} />
      </main>
      <Footer stats={stats} />
    </div>
  )
}
