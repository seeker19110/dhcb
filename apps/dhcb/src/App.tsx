import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LangProvider } from './context/LangProvider'
import { AppThemeProvider as ThemeProvider } from './context/AppThemeProvider'
import { AuthProvider } from './context/AuthProvider'
import DataPrecacheGate from './components/DataPrecacheGate'
import { ToastProvider } from '@core/ToastProvider'
import { useAuth } from './context/useAuth'
import { CardListSkeleton } from './components/Skeleton'
import { ErrorBoundary } from './components/ErrorBoundary'
import BottomNav from './components/BottomNav'
import DesktopSidebar from './components/DesktopSidebar'
import { SkipLink } from '@core/SkipLink'
import PromoEndingBanner from './components/PromoEndingBanner'
import PlanExpiryBanner from './components/PlanExpiryBanner'
import GuestBanner from './components/GuestBanner'
import { lazyWithRetry } from './lib/lazyWithRetry'
import {
  normalizeLegacySubjectsPath,
  duongDanMonTiengAnh,
  LEGACY_ENGLISH_PREFIXES,
  LEGACY_SUBJECTS_PREFIXES,
  SUBJECTS_PREFIX,
} from './lib/subjectsHost'
import { LEGACY_NOTES_PATHS, REMOVED_DOMAIN_PATHS } from './lib/navPaths'
import { refreshAppSettings } from './lib/appSettings'
import { pruneExpiredSessions } from './lib/learningSession'
import { refreshPlanFeatures } from './lib/planFeatures'
import { refreshPlanMarketing } from './lib/planMarketing'
import FeatureGate from './components/FeatureGate'
import LegacyProgrammingRedirect from './components/LegacyProgrammingRedirect'
import LegacyEnglishRedirect from './components/LegacyEnglishRedirect'
import { PROGRAMMING_PREFIX } from './lib/programmingRoutes'
import { ENGLISH_PREFIX } from './lib/englishRoutes'
// Dải báo đồng bộ hầu như luôn `return null` (chỉ hiện khi mất mạng / còn mục chờ / vừa gửi
// xong), nên nó KHÔNG đáng nằm trong chunk khởi động — nạp lười để giữ ngân sách Initial JS
// dưới trần 140 kB. Không bọc Suspense: khi chưa nạp xong, `lazy` render null, đúng bằng
// trạng thái thường trực của chính nó.
const OfflineSyncIndicator = lazy(() => import('./components/OfflineSyncIndicator'))
// Dùng lazyWithRetry thay cho React.lazy: tự tải lại 1 lần khi chunk lỗi
// ── 1. Core Platform & Shared Pages (Nền tảng dùng chung)
const Login = lazyWithRetry(() => import('./pages/core/Login'))
const Landing = lazyWithRetry(() => import('./pages/core/Landing'))
const LandingEn = lazyWithRetry(() => import('./pages/core/LandingEn'))
const ResetPassword = lazyWithRetry(() => import('./pages/core/ResetPassword'))
const Home = lazyWithRetry(() => import('./pages/core/Home'))
const History = lazyWithRetry(() => import('./pages/core/History'))
const Dashboard = lazyWithRetry(() => import('./pages/core/Dashboard'))
const Profile = lazyWithRetry(() => import('./pages/core/Profile'))
const Pricing = lazyWithRetry(() => import('./pages/core/Pricing'))
const Onboarding = lazyWithRetry(() => import('./pages/core/Onboarding'))
const Intake = lazyWithRetry(() => import('./pages/core/Intake'))
const StartByIntent = lazyWithRetry(() => import('./pages/core/StartByIntent'))
const MistakeBank = lazyWithRetry(() => import('./pages/core/MistakeBank'))
const ExamPlan = lazyWithRetry(() => import('./pages/learning/ExamPlan'))
const Quests = lazyWithRetry(() => import('./pages/core/Quests'))
const About = lazyWithRetry(() => import('./pages/core/About'))
const AdminDashboard = lazyWithRetry(() => import('./pages/core/AdminDashboard'))
const Friends = lazyWithRetry(() => import('./pages/core/Friends'))
const LiveLocation = lazyWithRetry(() => import('./pages/core/LiveLocation'))
const AddFriend = lazyWithRetry(() => import('./pages/core/AddFriend'))

// ── 2. AI Companion & Decision Studio (Bạn Đồng Hành AI)
const Companion = lazyWithRetry(() => import('./pages/companion/Companion'))
const ActionCanvas = lazyWithRetry(() => import('./pages/companion/ActionCanvas'))
const AvatarDemo = lazyWithRetry(() => import('./pages/companion/AvatarDemo'))

// ── 3. Multi-Subject Learning & STEM Studio (Góc học tập & Luyện Tập Đa Môn)
const Subjects = lazyWithRetry(() => import('./pages/learning/Subjects'))
const SubjectDetail = lazyWithRetry(() => import('./pages/learning/SubjectDetail'))
const StemLessonList = lazyWithRetry(() => import('./pages/learning/StemLessonList'))
const ReviewHub = lazyWithRetry(() => import('./pages/learning/ReviewHub'))
const StemReview = lazyWithRetry(() => import('./pages/learning/StemReview'))
const StemLessonView = lazyWithRetry(() => import('./pages/learning/StemLessonView'))
const Practice = lazyWithRetry(() => import('./pages/learning/Practice'))
const AppliedKnowledge = lazyWithRetry(() => import('./pages/learning/AppliedKnowledge'))

// ── 4. Trụ "Ghi chú"
// [2026-09-20] Các trụ Sự nghiệp, Khởi nghiệp và nửa "Đời sống" đã bị GỠ HẲN (trang, route,
// client API) theo quyết định của chủ dự án. Chỉ còn nửa "Công việc" cũ, nay mang tên "Ghi chú"
// và đứng riêng ở `/ghi-chu`. Mọi URL cũ của các trụ đã gỡ chuyển hướng về Trang chủ, của trụ
// Công việc chuyển hướng về `/ghi-chu` — không link nào gãy thành 404.
const Notes = lazyWithRetry(() => import('./pages/domains/notes/Notes'))
const NotesKanban = lazyWithRetry(() => import('./pages/domains/notes/NotesKanban'))

// ── 5. English Subject Module (Module Môn Học Tiếng Anh Chuyên Biệt)
const EnglishHome = lazyWithRetry(() => import('./pages/subjects/english/EnglishHome'))
const Chat = lazyWithRetry(() => import('./pages/subjects/english/Chat'))
const Writing = lazyWithRetry(() => import('./pages/subjects/english/Writing'))
const Speaking = lazyWithRetry(() => import('./pages/subjects/english/Speaking'))
const CommonPhrases = lazyWithRetry(() => import('./pages/subjects/english/CommonPhrases'))
const Listening = lazyWithRetry(() => import('./pages/subjects/english/Listening'))
const Stories = lazyWithRetry(() => import('./pages/subjects/english/Stories'))
const StoryReader = lazyWithRetry(() => import('./pages/subjects/english/StoryReader'))
const EnglishSettings = lazyWithRetry(() => import('./pages/subjects/english/EnglishSettings'))
const Placement = lazyWithRetry(() => import('./pages/subjects/english/Placement'))
const Challenge = lazyWithRetry(() => import('./pages/subjects/english/Challenge'))
const Dictionary = lazyWithRetry(() => import('./pages/subjects/english/Dictionary'))
const WordDetail = lazyWithRetry(() => import('./pages/subjects/english/WordDetail'))
const Lessons = lazyWithRetry(() => import('./pages/subjects/english/Lessons'))
const Learn = lazyWithRetry(() => import('./pages/subjects/english/Learn'))
const CefrLevelPage = lazyWithRetry(() => import('./pages/subjects/english/CefrLevelPage'))
const ProgrammingHome = lazyWithRetry(() => import('./pages/subjects/programming/ProgrammingHome'))
const ProgrammingAbout = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingAbout'),
)
const ProgrammingLevelPage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingLevelPage'),
)
const ProgrammingPlayground = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingPlayground'),
)
const ProgrammingLessonPage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingLessonPage'),
)
const ProgrammingReview = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingReview'),
)
const ProgrammingProjectPage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingProjectPage'),
)
const ProgrammingSpecializations = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingSpecializations'),
)
const ProgrammingSpecStagePage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingSpecStagePage'),
)
const ProgrammingSpecializationPage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingSpecializationPage'),
)
const ProgrammingCoursePage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingCoursePage'),
)
const ProgrammingPathPage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingPathPage'),
)
const ProgrammingPathStagePage = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingPathStagePage'),
)
const ProgrammingPathDiagnostic = lazyWithRetry(
  () => import('./pages/subjects/programming/ProgrammingPathDiagnostic'),
)
const ChatPage = lazyWithRetry(() => import('./pages/subjects/english/ChatPage'))

// Màn hình chờ — dùng khi kiểm tra session và khi lazy-load trang.
// Hiện khung skeleton nhấp nháy thay vì chữ trơ, đỡ cảm giác đơ.
// `data-page-loading` + `aria-busy`: cổng E2E (`waitForStableDom`) nhận ra khung chờ này — skeleton
// đứng yên vài trăm ms nên đếm phần tử KHÔNG đủ phân biệt "đang tải" với "đã xong".
function PageLoading() {
  return (
    <div className="min-h-dvh bg-zinc-950" aria-busy="true" data-page-loading="">
      <div className="h-14 border-b border-zinc-800/60" />
      <CardListSkeleton rows={6} />
    </div>
  )
}

// ── HAI lớp bảo vệ route (tách ra 2026-09-15, chế độ Khách) ───────────────────
// Trước đây chỉ có MỘT lớp `RequireAuth` bọc gần như mọi route, nên người chưa đăng nhập không
// xem được gì — tự chặn đúng người mình cần thuyết phục. Nay:
//
//   <AllowGuest>      — nội dung học/đọc: KHÁCH VÀO ĐƯỢC, tiến độ lưu localStorage.
//   <RequireAccount>  — cần tài khoản THẬT: hồ sơ, thanh toán, bạn bè, lịch sử, quản trị,
//                       và mọi thứ ghi dữ liệu cá nhân lên server.
//
// Đặc tả: docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md
// LUẬT khi thêm route mới: mặc định là `RequireAccount`. Chỉ chuyển sang `AllowGuest` khi trang
// đó thật sự không đọc/ghi dữ liệu riêng của một con người cụ thể.
function AllowGuest({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuth()
  if (loading) return <PageLoading />
  // `user` chỉ còn null trong khoảnh khắc trước lần refresh đầu — AuthProvider luôn cấp user
  // khách khi không có phiên.
  if (!user) return <PageLoading />
  if (!user.onboarded) return <Navigate to="/onboarding" replace />
  return (
    <>
      {/* Khách: nhắc tiến độ đang ở máy này + mời đăng ký. Hai banner kia chỉ có nghĩa với
          người đã đăng nhập (khuyến mãi, hạn gói) nên khách không thấy. */}
      {isGuest ? (
        <GuestBanner />
      ) : (
        <>
          <PromoEndingBanner />
          <PlanExpiryBanner />
        </>
      )}
      {children}
    </>
  )
}

// Bảo vệ route: chờ xác nhận session rồi mới quyết định redirect.
// Nếu chưa onboarding (lần đầu đăng nhập) → chuyển sang /onboarding trước.
function RequireAccount({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuth()
  if (loading) return <PageLoading />
  if (!user || isGuest) return <Navigate to="/login" replace />
  // [2026-09-13] TẮT lớp Intake 5 câu trước /onboarding — người dùng chốt sau khi thấy funnel
  // thật (20 đăng ký/14 ngày, chỉ 4 hoàn thành phiên học đầu): đăng ký xong vào thẳng
  // /onboarding (4 bước, có sẵn giá trị mặc định, bấm "Tiếp theo" là qua) thay vì phải qua thêm
  // 5 câu hỏi ở /bat-dau trước đó. Trang Intake.tsx (nay ở /bat-dau/doi-song) + API intakeApi
  // vẫn giữ nguyên, không xoá — chỉ không còn route nào điều hướng người dùng mới tới đó nữa.
  // Người đã onboarded từ trước KHÔNG bị chạm tới — họ không bao giờ vào nhánh này.
  if (!user.onboarded) return <Navigate to="/onboarding" replace />
  return (
    <>
      {/* Chỉ hiện cho user đã đăng nhập + đã onboard — banner báo trước sắp hết
          khuyến mãi, không cần thiết ở landing/login/onboarding. */}
      <PromoEndingBanner />
      {/* Banner "còn X ngày dùng gói VIP" (trial hoặc gói trả phí sắp hết hạn) */}
      <PlanExpiryBanner />
      {children}
    </>
  )
}

// Bảo vệ route quản trị (/admin-s): ngoài đăng nhập + onboard (RequireAccount), còn cần cờ
// user.isAdmin (server tính từ ADMIN_USER_IDS, trả về ở /api/auth?action=me — xem
// src/types.ts). Đây CHỈ là lớp che UI cho người dùng thường đỡ thấy khung/tên các mục quản
// trị nội bộ — không phải lớp bảo mật thật: mọi API admin vẫn TỰ kiểm lại quyền phía server
// (api/_lib/adminAuth.ts), nên dù cờ này bị qua mặt trên client thì dữ liệu vẫn an toàn.
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoading />
  if (!user?.isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

// Cập nhật thẻ <link rel="canonical"> theo route hiện tại để tránh lỗi SEO
// "canonical points to homepage instead of current page".
// Tên miền lấy từ biến môi trường VITE_SITE_URL (đặt khi build) để dễ dùng cho
// staging / domain khác; nếu không đặt thì mặc định domain production hiện tại.
const BASE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://www.donghanhcungban.org'
function CanonicalUpdater() {
  const { pathname } = useLocation()
  useEffect(() => {
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = BASE_URL + pathname
  }, [pathname])
  return null
}

// Prefetch các trang hay dùng nhất khi browser rảnh sau lần tải đầu
function usePrefetchPages() {
  useEffect(() => {
    const prefetch = () => {
      void import('./pages/core/Home')
      void import('./pages/subjects/english/Chat')
      void import('./pages/subjects/english/Learn')
      void import('./pages/subjects/english/Dictionary')
      void import('./pages/subjects/english/Lessons')
      void import('./pages/subjects/english/CommonPhrases')
      void import('./pages/subjects/english/Speaking')
    }
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetch)
    } else {
      setTimeout(prefetch, 3000)
    }
  }, [])
}

// Chu kỳ đồng bộ định kỳ khi app mở lâu (không đóng tab) — 1h là đủ mới cho cấu hình hiếm
// khi đổi (admin sửa hạn mức/khuyến mãi), và hầu như MIỄN PHÍ nhờ ETag/If-None-Match (xem
// refreshAppSettings() ở lib/appSettings.ts): admin chưa đổi gì → server trả 304 rỗng.
// Cân nhắc đã chọn polling thay vì server đẩy (WebSocket/SSE): cấu hình này đổi rất hiếm
// (admin sửa tay), không cần độ trễ tức thời — dựng thêm kết nối bền (WebSocket/SSE) chỉ để
// đẩy vài con số hiếm khi đổi là thừa hạ tầng so với lợi ích, trong khi polling 1h + ETag đã
// gần như miễn phí và không cần thêm gì ở server.
const APP_SETTINGS_POLL_MS = 60 * 60 * 1000

// Chuyển hướng mọi URL cũ của Góc học tập (`/mon-hoc`, `/subjects`, `/phong-hoc`,
// `/hoc-mon-hoc`, và alias Tiếng Anh `/hoc-tieng-anh`, `/tieng-anh`, `/english`) về đường dẫn
// chuẩn, GIỮ NGUYÊN phần đuôi + query + hash.
//
// Vì sao đọc `useLocation` thay vì dựng từ `useParams`: alias phải đi THẲNG tới đích cuối dù
// sâu bao nhiêu đoạn (`/mon-hoc/physics/bai-hoc/ly10-...`), và `?`/`#` là thứ người dùng đang
// mang theo — mất chúng là mất đúng chỗ họ đang đứng. `replace` để nút Back không kẹt vòng lặp
// giữa URL cũ và URL mới.
function LegacySubjectsRedirect() {
  const { pathname, search, hash } = useLocation()
  const normalized = normalizeLegacySubjectsPath(pathname) ?? SUBJECTS_PREFIX
  return <Navigate to={`${normalized}${search}${hash}`} replace />
}

export default function App() {
  usePrefetchPages()
  // Đồng bộ hạn mức/khuyến mãi thật từ server: ngay lúc mở app, định kỳ mỗi 1h nếu app mở
  // lâu, và mỗi lần quay lại tab (visibilitychange) — trình duyệt thường tạm dừng
  // setInterval khi tab ẩn/máy ngủ, nên bắt thêm sự kiện này để không phải đợi đủ 1h mới
  // đồng bộ lại sau khi user quay lại dùng tiếp.
  useEffect(() => {
    void refreshAppSettings()
    void refreshPlanFeatures()
    void refreshPlanMarketing()
    // Dọn nháp phiên học đã quá hạn (7 ngày) — một lần lúc khởi động, chỉ quét khoá
    // `dhcb_lsession_v1_*`, không đụng khoá khác. Xem lib/learningSession.ts.
    pruneExpiredSessions()
    const interval = setInterval(() => {
      void refreshAppSettings()
      void refreshPlanFeatures()
      void refreshPlanMarketing()
    }, APP_SETTINGS_POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshAppSettings()
        void refreshPlanFeatures()
        void refreshPlanMarketing()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return (
    <AuthProvider>
      <ThemeProvider>
        <LangProvider>
          <ToastProvider>
            <BrowserRouter>
              <CanonicalUpdater />
              {/* "Bỏ qua tới nội dung chính" — WCAG 2.4.1 (mức A).
                  ĐẶT Ở ĐÂY, KHÔNG PHẢI TRONG Layout: `DesktopSidebar` render trước Layout
                  trong cây, nên skip link nằm trong Layout thì người dùng đã Tab qua hết
                  sidebar mới tới nó — tức vô dụng. Đo thật lúc đặt sai chỗ: Tab lần 1 rơi
                  vào logo sidebar, không phải skip link. Phần tử này phải là điểm dừng Tab
                  ĐẦU TIÊN của trang. */}
              <SkipLink />
              {/* Chỉ hiện từ 1024px (`lg:`) — xem components/DesktopSidebar.tsx.
                  Ở ngoài ErrorBoundary vì tự định vị `fixed`, giống BottomNav. */}
              <DesktopSidebar />
              <ErrorBoundary>
                {/* `lg:pl-[var(--sidebar-w)]` chừa lề trái cho DesktopSidebar — biến CSS
                    đổi theo trạng thái thu gọn/mở rộng nên không cần biết sidebar rộng
                    bao nhiêu ở đây (xem index.css). */}
                <div className="lg:pl-[var(--sidebar-w)] transition-[padding] duration-200">
                  <Suspense fallback={<PageLoading />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      {/* Công khai, KHÔNG bọc RequireAuth — vào được khi chưa đăng nhập */}
                      <Route path="/welcome" element={<Landing />} />
                      <Route path="/learn-vietnamese" element={<LandingEn />} />
                      <Route path={`${ENGLISH_PREFIX}/tu-dien/:word`} element={<WordDetail />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      {/* [S05] /bat-dau nay la luong "bat dau theo y dinh" (cong khai, cho ca khach).
                          Luong Intake doi song cu GIU NGUYEN ma, chi doi sang route rieng. */}
                      <Route path="/bat-dau" element={<StartByIntent />} />
                      <Route path="/bat-dau/doi-song" element={<Intake />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/placement" element={<Placement />} />
                      <Route
                        path="/trang-ca-nhan"
                        element={
                          <RequireAccount>
                            <Profile />
                          </RequireAccount>
                        }
                      />
                      {/* Bảng giá / nâng cấp gói — tách khỏi trang Hồ sơ để so sánh 4 gói
                          cạnh nhau trên desktop (audit UI/UX 2026-08-31 mục B9). */}
                      <Route
                        path="/nang-cap"
                        element={
                          <RequireAccount>
                            <Pricing />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/on-thi`}
                        element={
                          <RequireAccount>
                            <ExamPlan />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/ban-dong-hanh"
                        element={
                          <RequireAccount>
                            <Companion />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/ban-be"
                        element={
                          <RequireAccount>
                            <Friends />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/ket-ban/:code"
                        element={
                          <RequireAccount>
                            <AddFriend />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/nhom-di-chung"
                        element={
                          <RequireAccount>
                            <LiveLocation />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/nhom-di-chung/:code"
                        element={
                          <RequireAccount>
                            <LiveLocation />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/tin-nhan"
                        element={
                          <RequireAccount>
                            <ChatPage />
                          </RequireAccount>
                        }
                      />
                      {/* Trang "Ghi chú" — trụ duy nhất còn lại của nhóm domain cũ. */}
                      <Route
                        path="/ghi-chu"
                        element={
                          <RequireAccount>
                            <Notes />
                          </RequireAccount>
                        }
                      />
                      {/* V2 Multi-Subject Learning Hub & Sub-pages */}
                      <Route
                        path="/goc-hoc-tap"
                        element={
                          <AllowGuest>
                            <Subjects />
                          </AllowGuest>
                        }
                      />
                      {/* Môn Lập trình có không gian riêng (như English) — đặt TRƯỚC
                          route param :subjectId để 'programming' không rơi vào SubjectDetail */}
                      <Route
                        path={PROGRAMMING_PREFIX}
                        element={
                          <AllowGuest>
                            <ProgrammingHome />
                          </AllowGuest>
                        }
                      />
                      {/* Mô tả khoá học môn Lập trình — CÔNG KHAI, cố ý đặt ngoài RequireAuth
                          (quyết định 2026-08-26): đây là trang giới thiệu môn, bắt đăng nhập
                          mới cho xem là tự chặn đúng người mình cần thuyết phục. */}
                      <Route
                        path={`${PROGRAMMING_PREFIX}/gioi-thieu`}
                        element={<ProgrammingAbout />}
                      />
                      <Route
                        path={`${PROGRAMMING_PREFIX}/du-an`}
                        element={
                          <AllowGuest>
                            <ProgrammingProjectPage />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${PROGRAMMING_PREFIX}/bai-hoc/:lessonId`}
                        element={
                          <AllowGuest>
                            <ProgrammingLessonPage />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${PROGRAMMING_PREFIX}/on-tap`}
                        element={
                          <AllowGuest>
                            <ProgrammingReview />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${PROGRAMMING_PREFIX}/chay-thu`}
                        element={
                          <AllowGuest>
                            <ProgrammingPlayground />
                          </AllowGuest>
                        }
                      />
                      {/* Hướng chuyên sâu — đặt TRƯỚC route param :levelId để 'huong'
                          không bị hiểu nhầm là mã bậc. */}
                      <Route
                        path={`${PROGRAMMING_PREFIX}/huong`}
                        element={
                          <AllowGuest>
                            <ProgrammingSpecializations />
                          </AllowGuest>
                        }
                      />
                      {/* Chặng của một hướng — route dài hơn nên đặt TRƯỚC ':specId'
                          để React Router khớp đúng, không nuốt mất đoạn stageId. */}
                      <Route
                        path={`${PROGRAMMING_PREFIX}/huong/:specId/:stageId`}
                        element={
                          <AllowGuest>
                            <ProgrammingSpecStagePage />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${PROGRAMMING_PREFIX}/huong/:specId`}
                        element={
                          <AllowGuest>
                            <ProgrammingSpecializationPage />
                          </AllowGuest>
                        }
                      />
                      {/* Khoá ngắn (cắt ngang bậc, ví dụ khoá Git) — đặt TRƯỚC ':levelId'
                          để 'khoa-hoc' không bị hiểu nhầm là mã bậc, cùng lý do như '/huong'. */}
                      <Route
                        path={`${PROGRAMMING_PREFIX}/khoa-hoc/:courseId`}
                        element={
                          <AllowGuest>
                            <ProgrammingCoursePage />
                          </AllowGuest>
                        }
                      />
                      {/* URL cũ trước 2026-08-31 — chuyển hướng giữ mã khoá. */}
                      <Route path="/lap-trinh/*" element={<LegacyProgrammingRedirect />} />
                      {/* Lộ trình mục tiêu (ví dụ Kỹ Sư Trưởng AI) — đặt TRƯỚC ':levelId'
                          để 'lo-trinh' không bị hiểu nhầm là mã bậc, cùng lý do như '/huong'.
                          Chẩn đoán đặt TRƯỚC ':pathId' (đoạn dài hơn khớp trước), cùng lý do
                          '/huong/:specId/:stageId' đặt trước '/huong/:specId'. */}
                      <Route
                        path={`${PROGRAMMING_PREFIX}/lo-trinh/:pathId/chan-doan`}
                        element={
                          <AllowGuest>
                            <ProgrammingPathDiagnostic />
                          </AllowGuest>
                        }
                      />
                      {/* Chặng riêng của lộ trình (đợt 4, P5 "Tầm trưởng") — dài hơn
                          ':pathId' nên đặt trước, cùng luật '/huong/:specId/:stageId'. */}
                      <Route
                        path={`${PROGRAMMING_PREFIX}/lo-trinh/:pathId/chang/:stageId`}
                        element={
                          <AllowGuest>
                            <ProgrammingPathStagePage />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${PROGRAMMING_PREFIX}/lo-trinh/:pathId`}
                        element={
                          <AllowGuest>
                            <ProgrammingPathPage />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${PROGRAMMING_PREFIX}/bac/:levelId`}
                        element={
                          <AllowGuest>
                            <ProgrammingLevelPage />
                          </AllowGuest>
                        }
                      />
                      {/* Trang tổng quan môn Tiếng Anh — Tiếng Anh là MỘT MÔN ngang hàng (slice 02,
                          docs/specs/2026-09-15-goc-hoc-tap-02-tieng-anh-la-mot-mon.md). Đặt TRƯỚC
                          `/goc-hoc-tap/:subjectId` cho người đọc thấy ngay; React Router 7 xếp
                          hạng theo độ cụ thể nên thứ tự không quyết định, nhưng ĐỪNG dời xuống
                          dưới. Đường dẫn cũ /hoc-tieng-anh, /tieng-anh, /english là alias (dưới). */}
                      <Route
                        path={duongDanMonTiengAnh()}
                        element={
                          <AllowGuest>
                            <EnglishHome />
                          </AllowGuest>
                        }
                      />
                      {/* Hub ôn tập xuyên môn (S12-1) — đặt TRƯỚC `/goc-hoc-tap/:subjectId`
                          để đoạn `on-tap` không bị hiểu thành một mã môn. Cần tài khoản: hàng
                          đợi là dữ liệu học của một người cụ thể. */}
                      <Route
                        path="/goc-hoc-tap/on-tap"
                        element={
                          <RequireAccount>
                            <ReviewHub />
                          </RequireAccount>
                        }
                      />
                      {/* Ôn thẻ của một môn STEM — dùng chung màn lật thẻ với môn Lập trình. */}
                      <Route
                        path="/goc-hoc-tap/:subjectId/on-tap"
                        element={
                          <RequireAccount>
                            <StemReview />
                          </RequireAccount>
                        }
                      />
                      {/* Bài học bốn môn STEM — đặt TRƯỚC route `:subjectId` để đoạn
                          `bai-hoc` không bị nuốt thành một mã môn. */}
                      <Route
                        path="/goc-hoc-tap/:subjectId/bai-hoc"
                        element={
                          <AllowGuest>
                            <StemLessonList />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path="/goc-hoc-tap/:subjectId/bai-hoc/:lessonSlug"
                        element={
                          <AllowGuest>
                            <StemLessonView />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path="/goc-hoc-tap/:subjectId"
                        element={
                          <AllowGuest>
                            <SubjectDetail />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path="/ghi-chu/kanban"
                        element={
                          <RequireAccount>
                            <NotesKanban />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/action-canvas"
                        element={
                          <RequireAccount>
                            <ActionCanvas />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/ung-dung-thuc-te"
                        element={
                          <AllowGuest>
                            <AppliedKnowledge />
                          </AllowGuest>
                        }
                      />
                      {/* Một host duy nhất phục vụ tất cả (cơ chế subdomain `hoc-tap.` đã gỡ
                          2026-09-20 — xem apps/dhcb/src/lib/subjectsHost.ts): trang gốc luôn là
                          trang chủ nền tảng, Góc học tập ở `/goc-hoc-tap`. */}
                      <Route
                        path="/"
                        element={
                          <AllowGuest>
                            <Home />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/tro-truyen`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="chat">
                              <Chat />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/luyen-viet`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="writing">
                              <Writing />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/luyen-noi`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="speaking">
                              <Speaking />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path="/luyen-tap"
                        element={
                          <AllowGuest>
                            <Practice />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/lo-trinh`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="learning_path">
                              <Learn />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/lo-trinh/:levelId`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="learning_path">
                              <CefrLevelPage />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/tu-dien`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="dictionary">
                              <Dictionary />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/bai-hoc`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="lessons">
                              <Lessons />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/cau-thong-dung`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="phrases">
                              <CommonPhrases />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/luyen-nghe`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="listening">
                              <Listening />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/truyen`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="listening">
                              <Stories />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/truyen/:id`}
                        element={
                          <AllowGuest>
                            <FeatureGate featureKey="listening">
                              <StoryReader />
                            </FeatureGate>
                          </AllowGuest>
                        }
                      />
                      <Route
                        path="/lich-su-hoc"
                        element={
                          <RequireAccount>
                            <History />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/tien-do"
                        element={
                          <RequireAccount>
                            <Dashboard />
                          </RequireAccount>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/so-tay-loi-sai`}
                        element={
                          <RequireAccount>
                            <FeatureGate featureKey="mistake_bank">
                              <MistakeBank />
                            </FeatureGate>
                          </RequireAccount>
                        }
                      />
                      <Route
                        path={`${ENGLISH_PREFIX}/thu-thach`}
                        element={
                          <RequireAccount>
                            <FeatureGate featureKey="challenge">
                              <Challenge />
                            </FeatureGate>
                          </RequireAccount>
                        }
                      />
                      {/* URL English cũ giữ tương thích bookmark, query và nút Back. */}
                      <Route path="/lo-trinh-hoc/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/bai-hoc/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/tro-truyen/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/luyen-noi/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/luyen-viet/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/luyen-nghe/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/tu-dien/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/tu-vung/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/cau-thong-dung/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/truyen-song-ngu/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/so-tay-loi-sai/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/on-thi/*" element={<LegacyEnglishRedirect />} />
                      <Route path="/thu-thach/*" element={<LegacyEnglishRedirect />} />
                      <Route
                        path="/cai-dat"
                        element={
                          <AllowGuest>
                            <EnglishSettings />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path="/nhiem-vu"
                        element={
                          <RequireAccount>
                            <FeatureGate featureKey="quests">
                              <Quests />
                            </FeatureGate>
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/gioi-thieu"
                        element={
                          <AllowGuest>
                            <About />
                          </AllowGuest>
                        }
                      />
                      <Route
                        path="/admin-s"
                        element={
                          <RequireAccount>
                            <RequireAdmin>
                              <AdminDashboard />
                            </RequireAdmin>
                          </RequireAccount>
                        }
                      />
                      <Route
                        path="/avatar-demo"
                        element={
                          <AllowGuest>
                            <AvatarDemo />
                          </AllowGuest>
                        }
                      />
                      {/* ── Gom URL trùng (Đợt 3, docs/research/nang-tam-du-an-2026-08-24.md §4) ──
                          Trước đây mỗi trang có tới 4 URL cùng render một component, không
                          redirect — đúng loại lỗi trùng nội dung vừa sửa ở tầng tên miền (PR #645),
                          nhưng ở tầng route. Nay mỗi trang có MỘT URL chính thức (tiếng Việt);
                          các URL cũ vẫn sống, chỉ chuyển hướng — không ai mất bookmark. */}
                      {/* [2026-09-20] URL CŨ của trụ Công việc → trang "Ghi chú". Bookmark và
                          link đã chia sẻ vẫn vào đúng chỗ, không thành 404. */}
                      {LEGACY_NOTES_PATHS.map((path) => (
                        <Route
                          key={path}
                          path={path}
                          element={<Navigate to="/ghi-chu" replace />}
                        />
                      ))}
                      {/* [2026-09-20] URL CŨ của các trụ ĐÃ GỠ (Sự nghiệp, Khởi nghiệp, Đời sống,
                          cùng các trang công cụ của chúng). Nội dung không còn tồn tại, nên đích
                          đúng là Trang chủ — cố tình KHÔNG đẩy sang "Ghi chú": đó là nội dung
                          khác hẳn, đưa người dùng tới đó là nói dối về nơi họ đang đứng. */}
                      {REMOVED_DOMAIN_PATHS.map((path) => (
                        <Route key={path} path={path} element={<Navigate to="/" replace />} />
                      ))}
                      <Route path="/companion" element={<Navigate to="/ban-dong-hanh" replace />} />
                      <Route path="/dong-hanh" element={<Navigate to="/ban-dong-hanh" replace />} />
                      <Route
                        path="/agent-ban-dong-hanh"
                        element={<Navigate to="/ban-dong-hanh" replace />}
                      />
                      <Route
                        path="/applied-knowledge"
                        element={<Navigate to="/ung-dung-thuc-te" replace />}
                      />
                      <Route
                        path="/mo-phong"
                        element={<Navigate to="/ung-dung-thuc-te" replace />}
                      />
                      <Route
                        path="/simulators"
                        element={<Navigate to="/ung-dung-thuc-te" replace />}
                      />
                      {/* Tiếng Anh từng là "không gian" riêng ở /hoc-tieng-anh (+ alias /tieng-anh,
                          /english). Nay là một môn: cả ba về trang tổng quan môn, giữ query/hash. */}
                      {LEGACY_ENGLISH_PREFIXES.map((prefix) => (
                        <Route key={prefix} path={prefix} element={<LegacySubjectsRedirect />} />
                      ))}
                      {LEGACY_ENGLISH_PREFIXES.map((prefix) => (
                        <Route
                          key={`${prefix}-deep`}
                          path={`${prefix}/*`}
                          element={<LegacySubjectsRedirect />}
                        />
                      ))}
                      {/* Môn Lập trình trước đây THIẾU alias tiếng Anh: mọi trụ/môn khác đều
                          có cặp Việt–Anh (/tieng-anh ↔ /english…), riêng /programming rơi vào
                          route `*` và bị
                          đẩy về trang chủ — không phải trang môn, cũng không phải 404. */}
                      <Route
                        path="/programming"
                        element={<Navigate to={PROGRAMMING_PREFIX} replace />}
                      />
                      <Route path="/profile" element={<Navigate to="/trang-ca-nhan" replace />} />
                      <Route
                        path="/phong-luyen-tap"
                        element={<Navigate to="/luyen-tap" replace />}
                      />
                      <Route path="/workspace" element={<Navigate to="/action-canvas" replace />} />
                      {/* Tiền tố CŨ của Góc học tập — một component lo hết mọi độ sâu, giữ
                          nguyên query/hash. `/*` để `/mon-hoc/physics/bai-hoc/<bài>` cũng về
                          đúng bài chứ không rơi xuống route `*` (đá về trang chủ). */}
                      {LEGACY_SUBJECTS_PREFIXES.map((prefix) => (
                        <Route
                          key={prefix}
                          path={`${prefix}/*`}
                          element={<LegacySubjectsRedirect />}
                        />
                      ))}
                      {LEGACY_SUBJECTS_PREFIXES.map((prefix) => (
                        <Route
                          key={`${prefix}-root`}
                          path={prefix}
                          element={<LegacySubjectsRedirect />}
                        />
                      ))}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </div>
              </ErrorBoundary>
              <Suspense fallback={null}>
                <OfflineSyncIndicator />
              </Suspense>
              {/* Tải ngầm dữ liệu học ngoại tuyến — chỉ khi đủ điều kiện (audit M14). */}
              <DataPrecacheGate />
              <BottomNav />
            </BrowserRouter>
          </ToastProvider>
        </LangProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
