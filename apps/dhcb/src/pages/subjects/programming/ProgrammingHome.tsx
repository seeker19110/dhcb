// ProgrammingHome — TRANG MÔN Lập trình: chỗ học viên quay lại mỗi ngày (PR-UX4).
//
// Thứ tự khối cố ý, mỗi khối trả lời một câu hỏi của người vừa mở app (đặc tả UI/UX §5.1):
//  ① "hôm nay học gì?"      → thẻ Học tiếp, to nhất, đứng đầu
//  ② "tôi đi tới đâu rồi?"  → dải tiến độ
//  ③ "sản phẩm tôi sao rồi?"→ dự án trục, hiện chặng đang ở
//  ④ "còn gì để làm?"       → ba nút tắt
//  ⑤ "đường còn dài không?" → cột mốc 6 bậc
//
// Trước PR này trang không đọc tiến độ, nên học viên quay lại sau vài ngày phải tự nhớ mình
// đang ở bài nào rồi bấm ba lần mới tới nơi. Đó là khiếm khuyết nặng nhất về giữ chân người học.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../../lib/usePageTitle'
import {
  Code2,
  Rocket,
  Store,
  Play,
  Brain,
  BookOpen,
  Trophy,
  PartyPopper,
  Compass,
  Map,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import LangBadge from '../../../components/programming/LangBadge'
import LevelMilestones from '../../../components/programming/LevelMilestones'
import { useAuth } from '../../../context/useAuth'
import { fetchProgress, type ProgrammingLessonProgress } from '../../../lib/programmingProgress'
import { countCompleted, countCompletedByLevel } from '../../../lib/programmingNextLesson'
import { programmingNext } from '../../../lib/today/programmingNext'
import { PROGRAMMING_LEVELS } from '@dhcb/subject-programming/curriculum'
import { UNLOCK_PCT } from '@dhcb/subject-programming/levelLock'
import { PROJECT_STAGES } from '@dhcb/subject-programming/projectSteps'
import { PROGRAMMING_SPECIALIZATIONS } from '@dhcb/subject-programming/specializations/registry'
import { SHORT_COURSES } from '@dhcb/subject-programming/courses/registry'
import { LEARNING_PATHS } from '@dhcb/subject-programming/learningPaths/registry'
import { levelLockMap, seedGrandfather, loiGiaiThichKhoa } from '../../../lib/programmingLevelLock'
import { effectivePlan } from '../../../lib/promo'
import { goToSubjects } from '../../../lib/subjectsHost'
import {
  PROGRAMMING_PREFIX,
  duongDanBac,
  duongDanKhoa,
  duongDanLoTrinh,
} from '../../../lib/programmingRoutes'
import { PageShell } from '@core/PageShell'
import { ContinueCard } from '../../../components/learning/ContinueCard'

const SO_KHOA_HIEN_TRUOC = 3
const MUC_LUC = [
  { id: 'bac-hoc', label: 'Bậc học P1–P5' },
  { id: 'chuyen-sau', label: 'Chuyên sâu' },
  { id: 'khoa-ngan', label: 'Khoá ngắn' },
  { id: 'lo-trinh-muc-tieu', label: 'Lộ trình mục tiêu' },
] as const

export default function ProgrammingHome() {
  usePageTitle('Môn Lập trình | Đồng hành cùng bạn')
  const nav = useNavigate()
  const { user } = useAuth()
  const [progress, setProgress] = useState<ProgrammingLessonProgress[]>([])
  // Phân biệt "chưa tải xong" với "đã tải, chưa học gì" — hai thứ này hiện khác nhau, nếu gộp
  // thì người học cũ sẽ thấy nhấp nháy chữ "Bắt đầu từ bài 1" trước khi tiến độ về.
  const [fetched, setFetched] = useState(false)
  // [2026-09-22, audit UI/UX P1-2] 13 khoá ngắn với mô tả 2–4 dòng từng đứng TRƯỚC bậc P1–P6 và
  // đẩy trang lên 5.671px ở 390px. Nay khối khoá ngắn nằm SAU bậc học, mặc định chỉ hiện 3.
  const [hienHetKhoa, setHienHetKhoa] = useState(false)
  // Chưa đăng nhập thì không có gì để tải — coi như đã xong ngay, KHÔNG setState trong effect
  // (đặt state đồng bộ trong effect gây render dây chuyền, ESLint chặn).
  const loaded = !user || fetched

  useEffect(() => {
    if (!user) return
    void fetchProgress(user.id).then((p) => {
      // Chống hồi tố: người đã học ở bậc nào từ TRƯỚC khi có luật khoá thì giữ nguyên quyền
      // vào bậc đó (đặc tả §①.3). Phải chạy sau khi tiến độ về, trước khi tính bản đồ khoá.
      seedGrandfather(user.id, p)
      setProgress(p)
      setFetched(true)
    })
  }, [user])

  // [S06-3] Một luật "học tiếp", ba nơi hiển thị: Trang chủ, trang môn này và thẻ "Hôm nay" đều
  // đi qua adapter `programmingNext`. Trang lấy `item` (tên bài + đường dẫn đã dựng sẵn) để
  // hiển thị, và `picked` (bậc, ngôn ngữ, cờ đang dở) cho những khối chỉ môn này mới có.
  const { next: item, picked } = programmingNext({ progress })
  const { done, total } = countCompleted(progress)
  // Tiến độ ĐƯA LÊN ĐẦU là của bậc đang học ("Bậc P1: 0/10 bài"), không phải "0/506 bài" của cả
  // môn — con số toàn môn làm nản người mới (luật số 1 của sản phẩm: chẩn đoán không phải màn
  // hình chính). Tổng vẫn ghi nhỏ bên cạnh.
  const bacDangHoc = picked ? PROGRAMMING_LEVELS.find((l) => l.id === picked.levelId) : undefined
  const tienDoBac = bacDangHoc ? countCompletedByLevel(progress, bacDangHoc.id) : undefined
  const xongMon = loaded && picked === undefined

  // Khoá bậc (GĐ3): Free đi tuần tự P1→P6, VIP vào bậc nào cũng được. Tính ở client CHỈ để
  // hiển thị — tiến độ thật vẫn do server giữ, và nội dung bài học không phải bí mật.
  const plan = user ? effectivePlan(user.plan) : 'free'
  const lockMap = levelLockMap(user?.id, progress, plan)
  // [P2-1, audit 2026-09-22] Câu "Còn N bài ở P1 nữa là mở…" lặp y hệt 5 lần (P2..P6) vì luật
  // khoá kế thừa cùng requiredLevelId. Chỉ bậc KẾ TIẾP bậc đang học mới cần câu giải thích đầy
  // đủ — bậc xa hơn chỉ cần biết "mở sau bậc nào" theo LevelMilestones bên dưới.
  const bacKeTiepDangKhoa = PROGRAMMING_LEVELS.find((l) => lockMap.get(l.id)?.locked === true)?.id

  // Chặng dự án đang ở = chặng của bậc chứa bài học tiếp; xong môn thì là chặng cuối.
  const changDangO =
    PROJECT_STAGES.find((s) => s.level === picked?.levelId) ??
    PROJECT_STAGES[PROJECT_STAGES.length - 1]

  const nutPhu =
    'tap-44 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-accent-500/60 text-white font-semibold text-sm transition active:scale-[0.98]'

  // Nhóm hiển thị 4 tầng cho môn Lập trình (chốt trong phiên, không đổi id/route/dữ liệu bậc):
  // Nền tảng = P1 · Cơ bản → Nâng cao = P2-P5 · Chuyên sâu = P6/14 hướng (khối riêng bên dưới).
  const nenTang = PROGRAMMING_LEVELS.filter((l) => l.id === 'p1')
  const coBanNangCao = PROGRAMMING_LEVELS.filter((l) => l.id !== 'p1' && l.id !== 'p6')
  const chuyenSau = PROGRAMMING_LEVELS.filter((l) => l.id === 'p6')

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout title="Môn Lập trình" onBack={() => goToSubjects(nav)} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Môn Lập trình
        </h1>

        {/* ① Học tiếp — khối quan trọng nhất trang, luôn đứng đầu */}
        {xongMon ? (
          <section className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-emerald-400 theme-light:text-emerald-900" />
              <span>Bạn đã đi hết {total} bài của môn</span>
            </h2>
            <p className="text-sm text-zinc-100 leading-relaxed read-measure">
              Giờ sản phẩm mới là thứ đáng khoe, không phải số bài. Quay lại dự án của bạn, hoặc ôn
              lại những khái niệm đã lâu không dùng.
            </p>
          </section>
        ) : (
          <ContinueCard
            eyebrow={picked?.resuming ? 'Đang học dở' : 'Học tiếp'}
            {...(item && picked
              ? {
                  title: item.title,
                  meta: (
                    <>
                      <LangBadge language={picked.lesson.language} />
                      <span className="text-[11px] font-semibold text-zinc-400">
                        Bậc {picked.levelId.toUpperCase()} — {picked.levelName}
                      </span>
                    </>
                  ),
                }
              : {})}
            actionLabel={!loaded ? 'Đang tải…' : picked?.resuming ? 'Học tiếp' : 'Bắt đầu bài này'}
            onAction={() => item && nav(item.href)}
            disabled={!item}
          >
            {done === 0 && loaded && (
              <button
                onClick={() => nav(`${PROGRAMMING_PREFIX}/gioi-thieu`)}
                className="tap-44 w-full text-center text-xs font-semibold text-zinc-400 hover:text-white underline underline-offset-2 transition sm:w-auto sm:text-left"
              >
                Khoá học này là gì? Học xong được gì?
              </button>
            )}
          </ContinueCard>
        )}

        {/* ② Tiến độ của BẠN — không phải tiến độ soạn bài */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-bold text-white">Tiến độ của bạn</h2>
            <p className="text-xs text-zinc-400">
              {bacDangHoc && tienDoBac ? (
                <>
                  Bậc {bacDangHoc.id.toUpperCase()}:{' '}
                  <strong className="text-emerald-300 theme-light:text-emerald-800">
                    {tienDoBac.done}
                  </strong>
                  /{tienDoBac.total} bài · cả môn {done}/{total}
                </>
              ) : (
                <>
                  <strong className="text-emerald-300 theme-light:text-emerald-800">{done}</strong>/
                  {total} bài
                </>
              )}
            </p>
          </div>
          <div
            className="h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden"
            role="progressbar"
            aria-label="Tiến độ môn Lập trình"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${total > 0 ? Math.round((done / total) * 100) : 0}%` }}
            />
          </div>
        </section>

        {/* Mục lục nhảy — trang dài ~6 màn hình ở mobile, cần đường tắt (Tầng 8b câu 2). */}
        <nav
          aria-label="Mục lục trang"
          className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1"
        >
          {MUC_LUC.map((m) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              className="tap-44 inline-flex items-center whitespace-nowrap rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:border-accent-500/60 hover:text-white transition"
            >
              {m.label}
            </a>
          ))}
        </nav>

        {/* ③ Dự án trục — hiện CHẶNG ĐANG Ở, không còn là thẻ mô tả tĩnh */}
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-accent-400" />
            <span>Dự án xuyên suốt — học tới đâu, xây tới đó</span>
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed read-measure">
            Mỗi bậc kết thúc bằng một chặng của <strong>cùng một sản phẩm</strong>: bắt đầu là máy
            tính tiền chạy chữ, kết thúc là web bán hàng của bạn chạy thật trên Internet — kèm repo
            GitHub làm hồ sơ xin việc.
          </p>
          <ol className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {PROJECT_STAGES.map((stage) => {
              const p = countCompletedByLevel(progress, stage.level)
              const xong = p.total > 0 && p.done === p.total
              const dangO = stage.level === changDangO?.level
              return (
                <li key={stage.level} className="shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
                      xong
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 theme-light:text-emerald-800'
                        : dangO
                          ? 'bg-accent-500/20 border-accent-500/60 text-zinc-100'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {stage.level.toUpperCase()}
                  </span>
                </li>
              )
            })}
          </ol>
          {changDangO && (
            <p className="text-sm text-zinc-200 flex items-start gap-2">
              <Store className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Bạn đang ở <strong>{changDangO.title}</strong>
              </span>
            </p>
          )}
          <button onClick={() => nav(`${PROGRAMMING_PREFIX}/du-an`)} className={`${nutPhu} w-full`}>
            <Trophy className="w-4 h-4 text-accent-400" />
            <span>Mở dự án của tôi</span>
          </button>
        </section>

        {/* ④ Ba nút tắt */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => nav(`${PROGRAMMING_PREFIX}/chay-thu`)} className={nutPhu}>
            <Play className="w-4 h-4 text-accent-400" />
            <span>Chạy thử tự do</span>
          </button>
          <button onClick={() => nav(`${PROGRAMMING_PREFIX}/on-tap`)} className={nutPhu}>
            <Brain className="w-4 h-4 text-accent-400" />
            <span>Ôn thẻ</span>
          </button>
          <button onClick={() => nav(`${PROGRAMMING_PREFIX}/gioi-thieu`)} className={nutPhu}>
            <BookOpen className="w-4 h-4 text-accent-400" />
            <span>Về khoá học</span>
          </button>
        </section>

        {/* ⑤ Lộ trình 6 bậc — cột mốc, thấy được mình đang ở đâu trên đường dài.
            Nhóm hiển thị theo 4 tầng (chốt trong phiên trò chuyện, không đổi id/route/dữ liệu
            bậc P1-P6 hiện có — chỉ tách JSX theo levelGroups bên dưới):
            Nền tảng (P1) · Cơ bản → Nâng cao (P2-P5) · Chuyên sâu theo nghề (P6/14 hướng, khối
            riêng bên dưới) · Khoá học (đã có khối "Khoá ngắn" ở trên). */}
        <section id="bac-hoc" className="scroll-mt-20 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-accent-400" />
            <span>Nền tảng — bắt buộc với mọi lập trình viên</span>
          </h2>
          <LevelMilestones
            levels={nenTang}
            progressOf={(levelId) => countCompletedByLevel(progress, levelId)}
            onOpen={(level) => nav(duongDanBac(level))}
            currentLevelId={picked?.levelId}
            lockOf={(levelId) => lockMap.get(levelId)}
            lockHint={loiGiaiThichKhoa}
            nextLockedLevelId={bacKeTiepDangKhoa}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-accent-400" />
            <span>Cơ bản → Nâng cao — {coBanNangCao.length} bậc</span>
          </h2>
          <LevelMilestones
            levels={coBanNangCao}
            progressOf={(levelId) => countCompletedByLevel(progress, levelId)}
            onOpen={(level) => nav(duongDanBac(level))}
            currentLevelId={picked?.levelId}
            lockOf={(levelId) => lockMap.get(levelId)}
            lockHint={loiGiaiThichKhoa}
            nextLockedLevelId={bacKeTiepDangKhoa}
          />
          {plan === 'free' && (
            <p className="text-xs text-zinc-400 leading-relaxed read-measure">
              Bậc sau mở khi bạn hoàn thành ít nhất {Math.round(UNLOCK_PCT * 100)}% số bài của bậc
              trước. VIP vào bậc nào cũng được.
            </p>
          )}
        </section>

        {/* ⑥ Chuyên sâu theo nghề nghiệp — trả lời câu "học xong môn này rồi sao nữa?" ngay tại
            đây, thay vì để học viên tự hỏi lúc gần hết P5. */}
        <section
          id="chuyen-sau"
          className="scroll-mt-20 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-sm"
        >
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Chuyên sâu — theo nghề nghiệp</span>
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed read-measure">
            Xong xương sống là bạn lập trình được. Từ đó có{' '}
            <strong>{PROGRAMMING_SPECIALIZATIONS.length} con đường</strong> đi tới mức chuyên gia —
            web, di động, backend, dữ liệu, AI, hệ thống, game, nhúng… Mỗi hướng 4 chặng và 5 sản
            phẩm phải nộp. Xem trước để biết mình đang học vì cái gì.
          </p>
          <LevelMilestones
            levels={chuyenSau}
            progressOf={(levelId) => countCompletedByLevel(progress, levelId)}
            onOpen={(level) => nav(duongDanBac(level))}
            currentLevelId={picked?.levelId}
            lockOf={(levelId) => lockMap.get(levelId)}
            lockHint={loiGiaiThichKhoa}
            nextLockedLevelId={bacKeTiepDangKhoa}
          />
          <button onClick={() => nav(`${PROGRAMMING_PREFIX}/huong`)} className={`${nutPhu} w-full`}>
            <Compass className="w-4 h-4 text-accent-400" />
            <span>Xem {PROGRAMMING_SPECIALIZATIONS.length} hướng chuyên sâu</span>
          </button>
        </section>

        {/* ④b Khoá ngắn — cắt ngang bậc, học được ngay không cần đợi tới bậc nào. Đặt sau ba
            nút tắt vì đây cũng là một "lối tắt", nhưng đủ quan trọng để có khối riêng thay vì
            chỉ là nút thứ tư. */}
        {SHORT_COURSES.length > 0 && (
          <section
            id="khoa-ngan"
            className="scroll-mt-20 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-sm"
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-400" aria-hidden="true" />
              <span>Khoá học — học ngay, không cần đợi tới bậc</span>
            </h2>
            {(hienHetKhoa ? SHORT_COURSES : SHORT_COURSES.slice(0, SO_KHOA_HIEN_TRUOC)).map(
              (course) => (
                <button
                  key={course.id}
                  onClick={() => nav(duongDanKhoa(course))}
                  className={`${nutPhu} w-full flex-col items-start !py-3 text-left`}
                >
                  <span className="flex items-center gap-2 w-full">
                    <Play className="w-4 h-4 text-accent-400 shrink-0" />
                    <span className="truncate">{course.title}</span>
                  </span>
                  <span className="text-xs font-normal text-zinc-400 leading-relaxed">
                    {course.canDo}
                  </span>
                </button>
              ),
            )}
            {SHORT_COURSES.length > SO_KHOA_HIEN_TRUOC && (
              <button
                type="button"
                onClick={() => setHienHetKhoa((v) => !v)}
                aria-expanded={hienHetKhoa}
                className={`${nutPhu} w-full`}
              >
                {hienHetKhoa ? 'Thu gọn' : `Xem tất cả ${SHORT_COURSES.length} khoá`}
              </button>
            )}
          </section>
        )}

        {/* ④c Lộ trình mục tiêu — khác hướng chuyên sâu (một trục), lộ trình ghép chặng của
            NHIỀU hướng thành một con đường tới một đích nghề (ví dụ Kỹ Sư Trưởng AI). Khối
            riêng để người có mục tiêu rõ tìm thấy ngay, không phải tự lắp từ 14 hướng. */}
        {LEARNING_PATHS.length > 0 && (
          <section
            id="lo-trinh-muc-tieu"
            className="scroll-mt-20 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-sm"
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-accent-400" aria-hidden="true" />
              <span>Lộ trình mục tiêu — một đích nghề, một con đường</span>
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed read-measure">
              Ghép sẵn các chặng của nhiều hướng chuyên sâu thành một con đường có thứ tự, đi từ nền
              tảng tới đích nghề — mỗi giai đoạn kết bằng một sản phẩm giữ lại được.
            </p>
            {LEARNING_PATHS.map((path) => (
              <button
                key={path.id}
                onClick={() => nav(duongDanLoTrinh(path))}
                className={`${nutPhu} w-full flex-col items-start !py-3 text-left`}
              >
                <span className="flex items-center gap-2 w-full">
                  <Map className="w-4 h-4 text-accent-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">{path.title}</span>
                </span>
                <span className="text-xs font-normal text-zinc-400 leading-relaxed">
                  {path.tagline}
                </span>
              </button>
            ))}
          </section>
        )}
      </PageShell>
    </div>
  )
}
