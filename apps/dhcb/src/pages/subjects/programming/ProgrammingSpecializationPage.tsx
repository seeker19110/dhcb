// ProgrammingSpecializationPage — CHI TIẾT MỘT HƯỚNG chuyên sâu (`/lap-trinh/huong/:specId`).
//
// Bố cục cố ý theo thứ tự câu hỏi của người đang cân nhắc:
//  ① "hướng này làm ra cái gì, hợp với tôi không?"  → tóm tắt + hợp với ai
//  ①b "hệ thống của hướng này chia module thế nào?" → bản đồ kiến trúc (module · hợp đồng ·
//      quyết định lớn · NFR · checklist đặc tả) — khối QUAN TRỌNG NHẤT với người sẽ ĐẶC TẢ cho
//      người khác hoặc cho AI thi hành thay vì tự gõ code
//  ② "đi thế nào?"                                   → 4 chặng, mỗi chặng module + dự án
//  ③ "cuối đường có gì?"                             → capstone
//  ④ "thế nào là giỏi?"                              → dấu hiệu chuyên gia + nghề nghiệp
//  ⑤ "cái gì làm người ta khựng lại?"                → bẫy thường gặp + nguồn học
//
// Mã hướng lạ thì nói KHÔNG BIẾT và mời quay lại danh sách — tuyệt đối không đoán bừa một hướng.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  Wrench,
  Target,
  Trophy,
  Sparkles,
  Briefcase,
  AlertTriangle,
  BookOpen,
  Boxes,
  FileSignature,
  GitBranch,
  Gauge,
  ClipboardCheck,
  GraduationCap,
} from 'lucide-react'
import Layout from '../../../components/Layout'
import Disclosure from '../../../components/Disclosure'
import { useAuth } from '../../../context/useAuth'
import {
  fetchSpecProgress,
  enrollSpec,
  unenrollSpec,
  setStageStatus,
  isStageCompleted,
  isEnrolled,
  EMPTY_SPEC_PROGRESS,
  type SpecProgressSnapshot,
} from '../../../lib/programmingSpecProgress'
import {
  getSpecialization,
  countArchitectureItems,
  type SpecProject,
  type SpecStage,
} from '@dhcb/subject-programming/specializations/registry'
import { unitsOfStage } from '@dhcb/subject-programming/specializations/stageUnits'
import { buildSlugSegment, idFromSlugSegment } from '@core/slug'
import {
  PROGRAMMING_PREFIX,
  duongDanChangHuong,
  duongDanHuong,
} from '../../../lib/programmingRoutes'
import { getProgrammingLevel } from '@dhcb/subject-programming/curriculum'
import { usePageTitle } from '../../../lib/usePageTitle'

const TIER_LABEL: Record<string, string> = {
  s1: 'Chặng 1 — căn bản',
  s2: 'Chặng 2 — vững tay',
  s3: 'Chặng 3 — nâng cao',
  s4: 'Chặng 4 — chuyên gia',
}

/** Một ô của bản đồ kiến trúc: tiêu đề + danh sách gạch đầu dòng. */
function ArchList({
  icon,
  title,
  hint,
  items,
}: {
  icon: React.ReactNode
  title: string
  hint: string
  items: string[]
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </h3>
      <p className="text-xs text-zinc-300 leading-relaxed read-measure">{hint}</p>
      <ul className="text-sm text-zinc-200 leading-relaxed space-y-1.5 list-disc pl-5 read-measure">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function ProjectBlock({ project, tone }: { project: SpecProject; tone: 'stage' | 'capstone' }) {
  const border = tone === 'capstone' ? 'border-emerald-500/40' : 'border-zinc-800'
  const bg = tone === 'capstone' ? 'bg-emerald-500/10' : 'bg-zinc-950'
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-4 space-y-2`}>
      <h4 className="text-sm font-bold text-white flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent-400 shrink-0" aria-hidden="true" />
        <span>Dự án: {project.name}</span>
      </h4>
      <p className="text-sm text-zinc-200 leading-relaxed read-measure">{project.brief}</p>
      <p className="text-xs font-semibold text-zinc-200">Xong nghĩa là đạt đủ:</p>
      <ul className="text-sm text-zinc-200 leading-relaxed space-y-1 list-disc pl-5 read-measure">
        {project.requirements.map((req) => (
          <li key={req}>{req}</li>
        ))}
      </ul>
      {project.stretch && project.stretch.length > 0 && (
        <p className="text-xs text-zinc-300 leading-relaxed read-measure">
          <span className="font-semibold text-zinc-200">Muốn đi xa hơn:</span>{' '}
          {project.stretch.join(' · ')}
        </p>
      )}
    </div>
  )
}

/**
 * Khối "vào học" — CHỈ hiện khi chặng đã có bài thật (bảng `SPEC_STAGE_UNITS`). Chặng chưa
 * soạn thì không hiện nút nào: hứa một nút dẫn tới trang rỗng còn tệ hơn là chưa có nút.
 */
function StageLessons({ stageId }: { stageId: string }) {
  const nav = useNavigate()
  const units = unitsOfStage(stageId)
  if (units.length === 0) return null
  const p6 = getProgrammingLevel('p6')
  const tieuDe = (id: string) => p6?.units.find((u) => u.id === id)?.title ?? id
  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2">
      <h4 className="text-sm font-bold text-white flex items-center gap-2">
        <GraduationCap
          className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900 shrink-0"
          aria-hidden="true"
        />
        <span>Chặng này đã có bài học ({units.length} phần)</span>
      </h4>
      <ul className="text-sm text-zinc-100 leading-relaxed space-y-1 list-disc pl-5 read-measure">
        {units.map((id) => (
          <li key={id}>{tieuDe(id)}</li>
        ))}
      </ul>
      {/* [0500, audit mục 7] Bề ngang theo nội dung từ `sm` — nút kéo hết khung ~1.100px ở
          1440px là mẫu của mobile. Đây là hành động CHÍNH của chặng nên là `primary`. */}
      <button
        onClick={() => nav(`${PROGRAMMING_PREFIX}/bac/p6`)}
        className={buttonClass({ variant: 'primary', className: 'w-full sm:w-auto' })}
      >
        Vào học chặng này
      </button>
    </div>
  )
}

function StageBlock({
  stage,
  xong,
  onToggle,
  onOpen,
  dangLuu,
}: {
  stage: SpecStage
  xong: boolean
  /** Mở trang chặng: nơi có bài luyện tay, câu tự kiểm và rubric nghiệm thu. */
  onOpen: () => void
  /** null khi chưa đăng nhập — không hiện nút đánh dấu, trang vẫn đọc được đầy đủ. */
  onToggle: (() => void) | null
  dangLuu: boolean
}) {
  return (
    <li
      className={`rounded-3xl border bg-zinc-900/80 p-5 space-y-4 ${
        xong ? 'border-emerald-500/60' : 'border-zinc-800'
      }`}
    >
      <div className="space-y-1.5">
        {/* Nhãn chặng dùng zinc-300 chứ không phải accent-400: accent ở theme nền sáng
            không đạt tương phản AA cho CHỮ (cổng e2e/a11y.spec.ts bắt được). */}
        <p className="text-xs font-semibold text-zinc-300">
          {TIER_LABEL[stage.tier] ?? stage.tier}
        </p>
        <h3 className="text-base font-bold text-white leading-snug">{stage.name}</h3>
        <p className="text-sm text-zinc-200 leading-relaxed read-measure">
          <span className="font-semibold">Học xong làm được:</span> {stage.canDo}
        </p>
        <p className="text-xs text-zinc-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{stage.duration}</span>
        </p>
      </div>

      {/* [0500, audit M22] Danh sách module GẬP sẵn: 4 chặng × 5 module mở cả ra chiếm phần lớn
          12.118px của trang ở 390px. Chi tiết đầy đủ vẫn ở trang chặng ("Mở chặng …"). */}
      <Disclosure summary={`Xem ${stage.modules.length} module của chặng`}>
        <ol className="space-y-3">
          {stage.modules.map((mod, i) => (
            <li key={mod.id} className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {i + 1}. {mod.title}
              </h4>
              <ul className="text-sm text-zinc-200 leading-relaxed space-y-1 list-disc pl-5 read-measure">
                {mod.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Disclosure>

      <StageLessons stageId={stage.id} />

      <ProjectBlock project={stage.project} tone="stage" />

      {/* [0500] Hai hành động cuối chặng chung MỘT hàng từ `sm` và theo bề ngang nội dung. "Mở
          chặng" là nút PHỤ: nút chính của chặng là "Vào học chặng này" ở khối bài học. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          onClick={onOpen}
          className={buttonClass({ variant: 'secondary', className: 'w-full sm:w-auto' })}
        >
          Mở chặng {stage.tier.toUpperCase()} — chi tiết & nghiệm thu
        </button>

        {onToggle && (
          <button
            onClick={onToggle}
            // Đã xong là trạng thái CHỐT ở server (không kéo lùi) — nút khoá lại thay vì để bấm
            // rồi không có gì đổi, người học tưởng hỏng.
            disabled={dangLuu || xong}
            aria-pressed={xong}
            className={`tap-44 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-colors disabled:opacity-60 ${
              xong
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 theme-light:text-emerald-900'
                : 'bg-zinc-950 border-zinc-700 text-zinc-100 hover:border-accent-500/60'
            }`}
          >
            {xong ? (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Circle className="w-4 h-4" aria-hidden="true" />
            )}
            {xong ? 'Đã xong chặng này' : 'Đánh dấu đã xong chặng này'}
          </button>
        )}
      </div>
    </li>
  )
}

export default function ProgrammingSpecializationPage() {
  const nav = useNavigate()
  // URL là `<mã hướng>--<tên hướng đã slug hoá>` — mã đứng đầu nên link cũ (chỉ mã) vẫn tra
  // ra đúng hướng rồi được chuyển hướng về URL chuẩn.
  const { specId: specSlugParam } = useParams<{ specId: string }>()
  const { user } = useAuth()
  const spec = getSpecialization(idFromSlugSegment(specSlugParam ?? ''))
  usePageTitle(`${spec?.name ?? 'Hướng chuyên sâu'} | Môn Lập trình`)
  const [progress, setProgress] = useState<SpecProgressSnapshot>(EMPTY_SPEC_PROGRESS)
  const [dangLuu, setDangLuu] = useState(false)

  useEffect(() => {
    if (!user) return
    void fetchSpecProgress(user.id).then(setProgress)
  }, [user])

  // Một lần lưu = một lần gọi server rồi đọc lại snapshot (server là nguồn sự thật, kể cả khi
  // nó tự đổi vai trò hướng hoặc từ chối id lạ).
  async function luu(work: () => Promise<SpecProgressSnapshot>) {
    setDangLuu(true)
    try {
      setProgress(await work())
    } finally {
      setDangLuu(false)
    }
  }

  const dangTheo = spec ? isEnrolled(progress, spec.id) : false
  const laHuongNen = spec?.crossCutting === true

  if (!spec) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <Layout title="Không có hướng này" onBack={() => nav(`${PROGRAMMING_PREFIX}/huong`)} />
        {/* [2026-09-02, đợt 4 thiết kế lại desktop] */}
        <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-4">
          <h1 tabIndex={-1} className="sr-only focus:outline-none">
            Không có hướng này
          </h1>
          <button
            onClick={() => nav(`${PROGRAMMING_PREFIX}/huong`)}
            className="tap-44 w-full py-3.5 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold text-sm transition"
          >
            Xem 14 hướng chuyên sâu
          </button>
        </PageShell>
      </div>
    )
  }

  // Link cũ (chỉ mã) hoặc tên hướng đã đổi → về URL chuẩn, tránh hai URL cùng nội dung.
  const canonicalSpec = buildSlugSegment(spec.id, spec.name)
  if (specSlugParam !== canonicalSpec) {
    return <Navigate to={duongDanHuong(spec)} replace />
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout title={spec.name} onBack={() => nav(`${PROGRAMMING_PREFIX}/huong`)} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {spec.name}
        </h1>

        {/* Chọn/bỏ hướng — tiến độ lưu ở server, không phải localStorage, nên đổi máy vẫn còn. */}
        {user && (
          <section
            className={`rounded-3xl border p-5 space-y-3 ${
              dangTheo ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2
                className="w-5 h-5 text-emerald-300 theme-light:text-emerald-900"
                aria-hidden="true"
              />
              <span>{dangTheo ? 'Bạn đang theo hướng này' : 'Theo hướng này?'}</span>
            </h2>
            <p className="text-sm text-zinc-100 leading-relaxed read-measure">
              {laHuongNen
                ? 'Đây là hướng NỀN — theo hướng này không thay hướng chính của bạn, hai bên học song song.'
                : 'Đây là hướng SẢN PHẨM — mỗi lúc chỉ theo MỘT hướng chính. Chọn hướng này sẽ thay hướng chính đang theo (nếu có); tiến độ chặng của hướng cũ vẫn còn nguyên.'}
            </p>
            <button
              onClick={() =>
                void luu(() =>
                  dangTheo ? unenrollSpec(user.id, spec.id) : enrollSpec(user.id, spec.id),
                )
              }
              disabled={dangLuu}
              // [0500] `primary` khi chưa theo, `outline` khi đang theo (bỏ theo là hành động phụ);
              // bề ngang theo nội dung từ `sm` thay vì kéo hết khung ở desktop.
              className={buttonClass({
                variant: dangTheo ? 'outline' : 'primary',
                className: 'w-full sm:w-auto',
              })}
            >
              {dangLuu ? 'Đang lưu…' : dangTheo ? 'Bỏ theo hướng này' : 'Chọn hướng này'}
            </button>
          </section>
        )}

        {/* ① Hợp với ai + điều kiện vào */}
        <section className="rounded-3xl border border-accent-500/40 bg-zinc-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Hướng này hợp với ai</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">{spec.forWho}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Lock className="w-3 h-3" aria-hidden="true" />
              Cần xong bậc {spec.prerequisite.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-300">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {spec.duration}
            </span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            <span className="font-semibold">Ngôn ngữ:</span> {spec.languages.join(' · ')}
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed flex items-start gap-2 read-measure">
            <Wrench className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <span className="font-semibold">Công cụ lõi:</span> {spec.coreTools.join(' · ')}
            </span>
          </p>
        </section>

        {/* ①b Bản đồ kiến trúc — khối nặng nhất trang, cố ý đứng TRƯỚC lộ trình học.
            Người đã đi làm mở trang này thường cần biết "hệ thống chia module thế nào" trước
            khi quan tâm bài học nào trước bài học nào. */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-accent-400" aria-hidden="true" />
              <span>Kiến trúc &amp; module của hướng này</span>
            </h2>
            <p className="text-xs text-zinc-300">{countArchitectureItems(spec)} mục</p>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            Phần này dành cho người sẽ <strong>quyết định và đặc tả</strong> — kể cả khi phần code
            do AI hoặc người khác viết. Thiếu ranh giới module thì bên thi hành tự bịa cấu trúc;
            thiếu hợp đồng thì hai phần viết xong không ghép được; thiếu ngưỡng phi chức năng thì
            code chạy được nhưng chậm hoặc không an toàn.
          </p>

          {/* [0500, audit M22] Năm khối kiến trúc GẬP sẵn — đọc khi đặc tả, không phải mỗi lần mở
              trang. Đoạn giới thiệu phía trên vẫn hiện để người đọc biết bên trong có gì. */}
          <Disclosure
            summary={`Xem kiến trúc chi tiết (${countArchitectureItems(spec)} mục)`}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80"
          >
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-accent-400" aria-hidden="true" />
                <span>Module điển hình &amp; trách nhiệm</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed read-measure">
                Mỗi module chịu trách nhiệm MỘT việc — và quan trọng không kém: không được làm việc
                gì.
              </p>
              <ul className="space-y-2">
                {spec.architecture.modules.map((mod) => (
                  <li key={mod.name} className="text-sm text-zinc-200 leading-relaxed read-measure">
                    <span className="font-semibold text-white">{mod.name}</span> — {mod.role}
                  </li>
                ))}
              </ul>
            </div>

            <ArchList
              icon={<FileSignature className="w-4 h-4 text-accent-400" aria-hidden="true" />}
              title="Hợp đồng giữa các module"
              hint="Cái gì đi qua ranh giới và ràng buộc nào phải giữ. Đây là thứ quyết định hai phần code ghép được với nhau."
              items={spec.architecture.contracts}
            />

            <ArchList
              icon={<GitBranch className="w-4 h-4 text-accent-400" aria-hidden="true" />}
              title="Quyết định phải chốt sớm"
              hint="Những lựa chọn mà đổi về sau rất đắt. Chốt xong nên ghi thành ADR kèm phương án đã loại."
              items={spec.architecture.keyDecisions}
            />

            <ArchList
              icon={<Gauge className="w-4 h-4 text-accent-400" aria-hidden="true" />}
              title="Yêu cầu phi chức năng (NFR)"
              hint="Phải ghi thành SỐ trong đặc tả. NFR không đo được là NFR không tồn tại."
              items={spec.architecture.nfrs}
            />

            <div className="rounded-2xl border border-accent-500/40 bg-zinc-900 p-4 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-accent-400" aria-hidden="true" />
                <span>Checklist khi viết đặc tả cho hướng này</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed read-measure">
                Thiếu ô nào thì bên thi hành (người hoặc AI) sẽ tự đoán — và thường đoán sai.
              </p>
              <ul className="text-sm text-zinc-200 leading-relaxed space-y-1.5 list-disc pl-5 read-measure">
                {spec.architecture.specChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Disclosure>
        </section>

        {/* ② Bốn chặng */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white">
            Lộ trình {spec.stages.length} chặng — học tới đâu nộp sản phẩm tới đó
          </h2>
          <ol className="space-y-4">
            {spec.stages.map((stage) => (
              <StageBlock
                key={stage.id}
                stage={stage}
                xong={isStageCompleted(progress, stage.id)}
                onOpen={() => nav(duongDanChangHuong(spec, stage))}
                dangLuu={dangLuu}
                onToggle={
                  user ? () => void luu(() => setStageStatus(user.id, stage.id, 'completed')) : null
                }
              />
            ))}
          </ol>
        </section>

        {/* ③ Capstone */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white">Sản phẩm tốt nghiệp hướng</h2>
          <ProjectBlock project={spec.capstone} tone="capstone" />
        </section>

        {/* ④ Thế nào là giỏi */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Dấu hiệu bạn đã thành chuyên gia</span>
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed read-measure">
            Đây là hành vi quan sát được, không phải số năm kinh nghiệm.
          </p>
          <ul className="text-sm text-zinc-200 leading-relaxed space-y-1.5 list-disc pl-5 read-measure">
            {spec.expertSignals.map((sig) => (
              <li key={sig}>{sig}</li>
            ))}
          </ul>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pt-1">
            <Briefcase className="w-4 h-4 text-accent-400" aria-hidden="true" />
            <span>Vị trí công việc mở ra</span>
          </h3>
          <ul className="flex flex-wrap gap-2">
            {spec.careers.map((career) => (
              <li
                key={career}
                className="px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-200"
              >
                {career}
              </li>
            ))}
          </ul>
        </section>

        {/* ⑤ Bẫy + nguồn học */}
        <section className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle
              className="w-5 h-5 text-amber-400 theme-light:text-amber-900"
              aria-hidden="true"
            />
            <span>Bẫy khiến người học đứng lại ở mức trung bình</span>
          </h2>
          <ul className="text-sm text-zinc-100 leading-relaxed space-y-1.5 list-disc pl-5 read-measure">
            {spec.pitfalls.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Nguồn học chuẩn của ngành</span>
          </h2>
          <ul className="text-sm text-zinc-200 leading-relaxed space-y-1.5 list-disc pl-5 read-measure">
            {spec.resources.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </PageShell>
    </div>
  )
}
