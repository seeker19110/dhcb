// ProgrammingSpecializations — DANH SÁCH 12 HƯỚNG CHUYÊN SÂU của môn Lập trình (`/lap-trinh/huong`).
//
// Vì sao có trang này: P1–P5 là xương sống chung, học xong ai cũng "lập trình được". Nhưng
// "chuyên gia" thì không có đường chung — người làm web, người làm nhúng, người làm hệ thống đi
// ba con đường khác hẳn. Trang này bày ra đủ 12 con đường để học viên chọn CÓ THÔNG TIN, thay vì
// chọn theo lời đồn trên mạng.
//
// Nguyên tắc trình bày (luật số 1 của sản phẩm): đây là CÔNG CỤ CHỌN VIỆC, không phải bảng xếp
// hạng người. Không hướng nào được gắn nhãn "xịn hơn"; mỗi thẻ nói rõ hợp với ai và cần bậc nào.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PROGRAMMING_PREFIX, duongDanHuong } from '../../../lib/programmingRoutes'
import { Compass, Clock, Lock, ArrowRight, Boxes, Layers, CheckCircle2 } from 'lucide-react'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import { useAuth } from '../../../context/useAuth'
import {
  fetchSpecProgress,
  countCompletedStages,
  isEnrolled,
  EMPTY_SPEC_PROGRESS,
  type SpecProgressSnapshot,
} from '../../../lib/programmingSpecProgress'
import {
  productSpecializations,
  crossCuttingSpecializations,
  countArchitectureItems,
  type ProgrammingSpecialization,
} from '@dhcb/subject-programming/specializations/registry'

// Mục lục nhảy — 14 hướng đẩy trang lên ~4.556px ở mobile, không có đường tắt (P2-3, Tầng 8b).
const MUC_LUC = [
  { id: 'huong-san-pham', label: '11 hướng sản phẩm' },
  { id: 'huong-nen', label: '3 hướng nền' },
] as const

function SpecCard({
  spec,
  onOpen,
  theo,
  soChangXong,
}: {
  spec: ProgrammingSpecialization
  onOpen: () => void
  /** Học viên đang theo hướng này (chính hoặc nền) — nhãn lấy từ tiến độ đã lưu ở server. */
  theo: boolean
  soChangXong: number
}) {
  return (
    <li>
      <button
        onClick={onOpen}
        className={`tap-44 w-full h-full text-left rounded-3xl border bg-zinc-900/80 p-5 space-y-3 hover:border-accent-500/60 transition active:scale-[0.99] ${
          theo ? 'border-emerald-500/60' : 'border-zinc-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-white leading-snug">{spec.name}</h2>
          <ArrowRight className="w-4 h-4 text-accent-400 shrink-0 mt-1" aria-hidden="true" />
        </div>
        {theo && (
          <p className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/50 text-emerald-200 theme-light:text-emerald-900">
            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
            Bạn đang theo hướng này · {soChangXong}/{spec.stages.length} chặng xong
          </p>
        )}
        <p className="text-sm text-zinc-200 leading-relaxed read-measure">{spec.tagline}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-300">
            <Lock className="w-3 h-3" aria-hidden="true" />
            Cần xong bậc {spec.prerequisite.toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-950 border border-zinc-800 text-zinc-300">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {spec.duration}
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed read-measure">
          <span className="font-semibold text-zinc-200">Ngôn ngữ chính:</span>{' '}
          {spec.languages.join(' · ')}
        </p>
        <p className="text-xs text-zinc-300 leading-relaxed flex items-center gap-1.5 read-measure">
          <Boxes className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            Bản đồ kiến trúc: {spec.architecture.modules.length} module ·{' '}
            {countArchitectureItems(spec)} mục
          </span>
        </p>
      </button>
    </li>
  )
}

export default function ProgrammingSpecializations() {
  usePageTitle('Các hướng chuyên sâu | Môn Lập trình · Đồng hành cùng bạn')
  const nav = useNavigate()
  const { user } = useAuth()
  const [progress, setProgress] = useState<SpecProgressSnapshot>(EMPTY_SPEC_PROGRESS)

  // Chưa đăng nhập thì không có tiến độ để tải — trang vẫn xem được đầy đủ, chỉ không có nhãn.
  useEffect(() => {
    if (!user) return
    void fetchSpecProgress(user.id).then(setProgress)
  }, [user])

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout title="Hướng chuyên sâu" onBack={() => nav(PROGRAMMING_PREFIX)} />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Trước đây một cột `max-w-4xl` ở mọi bề rộng. */}
      <PageShell width="standard" baseWidth="max-w-4xl" className="space-y-6">
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Hướng chuyên sâu
        </h1>

        {/* Mục lục nhảy — trang dài, cần đường tắt dưới 1024px (Tầng 8b câu 2, P2-3). */}
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

        <section className="rounded-3xl border border-accent-500/40 bg-zinc-900 p-5 space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent-400" aria-hidden="true" />
            <span>Chọn thế nào cho đỡ hối hận</span>
          </h2>
          <ul className="text-sm text-zinc-200 leading-relaxed space-y-1.5 list-disc pl-5 read-measure">
            <li>
              Chọn theo <strong>sản phẩm bạn muốn làm ra</strong>, không theo mức lương người ta
              đồn.
            </li>
            <li>
              Đọc mục <em>&ldquo;hợp với ai&rdquo;</em> và mục <em>&ldquo;bẫy thường gặp&rdquo;</em>{' '}
              của hướng trước khi quyết.
            </li>
            <li>
              Đi <strong>một hướng chính</strong> tới hết chặng 3 rồi hẵng mở hướng thứ hai. Riêng{' '}
              <strong>Kiến trúc</strong> và <strong>Thuật toán</strong> là hướng nền — học song
              song, không thay thế.
            </li>
            <li>
              Mỗi hướng có phần <strong>&ldquo;Kiến trúc &amp; module&rdquo;</strong> riêng: module
              nào, hợp đồng gì, quyết định nào phải chốt sớm, ngưỡng phi chức năng nào. Đọc phần đó
              nếu việc của bạn là <em>đặc tả cho người khác (hoặc AI) code</em>.
            </li>
            <li>Đổi hướng giữa chừng không mất gì: chặng 1 của hướng nào cũng dùng lại nền cũ.</li>
          </ul>
        </section>

        <section id="huong-san-pham" className="scroll-mt-20 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-400" aria-hidden="true" />
            <span>Hướng sản phẩm — chọn MỘT làm hướng chính</span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {productSpecializations().map((spec) => (
              <SpecCard
                key={spec.id}
                spec={spec}
                theo={isEnrolled(progress, spec.id)}
                soChangXong={countCompletedStages(progress, spec.id)}
                onOpen={() => nav(duongDanHuong(spec))}
              />
            ))}
          </ul>
        </section>

        {/* Hai hướng NỀN tách riêng: gộp chung danh sách trên khiến người học tưởng phải chọn
            một trong 13, trong khi hai hướng này học SONG SONG với hướng chính. */}
        <section id="huong-nen" className="scroll-mt-20 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Boxes className="w-4 h-4 text-accent-400" aria-hidden="true" />
            <span>Hướng nền — học SONG SONG, không thay hướng chính</span>
          </h2>
          <p className="text-sm text-zinc-200 leading-relaxed read-measure">
            Hai hướng này cắt ngang mọi hướng trên. Đặc biệt{' '}
            <strong>Kiến trúc hệ thống &amp; Đặc tả</strong> là hướng dành cho người sẽ quyết định
            và viết đặc tả để người khác — hoặc AI — thi hành, thay vì tự gõ từng dòng.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {crossCuttingSpecializations().map((spec) => (
              <SpecCard
                key={spec.id}
                spec={spec}
                theo={isEnrolled(progress, spec.id)}
                soChangXong={countCompletedStages(progress, spec.id)}
                onOpen={() => nav(duongDanHuong(spec))}
              />
            ))}
          </ul>
        </section>
      </PageShell>
    </div>
  )
}
