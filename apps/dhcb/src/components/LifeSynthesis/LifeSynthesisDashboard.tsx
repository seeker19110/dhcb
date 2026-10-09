// LifeSynthesisDashboard — khối "30 ngày qua của bạn" trong studio "Kế hoạch" của Bạn Đồng Hành.
//
// Đặc tả: docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md (changelog 0550).
//
// Bật lại sau changelog 0475 (bản cũ hiện điểm 88/92/85 BỊA cho mọi người). Nay chỉ hiện phép
// ĐẾM trên bản ghi thật của hai trụ Học tập + Ghi chú do server tính (`/api/life-synthesis`):
//   - không thanh điểm, không "x/100", không phần trăm, không xếp loại (Luật số 1 — đây là công
//     cụ chọn việc, không phải bảng chấm điểm con người; khối nằm trong một studio phụ, không
//     phải màn hình chính);
//   - câu nhận xét/gợi ý do server sinh tất định theo luật — client chỉ hiển thị;
//   - đủ ba trạng thái: đang tải (khung chờ) · lỗi (LoadError + Thử lại) · rỗng (nói thật).
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, FolderKanban, GraduationCap, Lightbulb } from 'lucide-react'
import type {
  LifeSynthesisReport,
  SubjectActivity,
  SynthesisObservation,
} from '@dhcb/core-contracts/lifeSynthesis'
import { buttonClass } from '@core/buttonStyles'
import LoadError from '../LoadError'
import { Skeleton } from '../Skeleton'
import { useAsyncLoad } from '../../lib/useAsyncLoad'
import { fetchLifeSynthesisReport } from '../../lib/lifeSynthesisApi'
import { duongDanDich } from '../../lib/lifeSynthesisRoutes'

const HEADING_ID = 'life-synthesis-heading'

/** `YYYY-MM-DD` → `dd/mm`. */
function ngayNgan(day: string): string {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

function moTaMon(s: SubjectActivity, today: string): string {
  const ganNhat = s.lastActiveDate === today ? 'hôm nay' : ngayNgan(s.lastActiveDate)
  return `${s.activeDays} ngày có học · gần nhất ${ganNhat}`
}

function DanhSachNhanXet({ items }: { items: SynthesisObservation[] }) {
  if (items.length === 0) return null
  return (
    <ul className="space-y-1.5">
      {items.map((o, i) => (
        <li
          key={`${o.ruleId}-${i}`}
          className="flex gap-2 text-sm leading-relaxed text-content-secondary"
        >
          <span
            aria-hidden="true"
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
          />
          <span>{o.text}</span>
        </li>
      ))}
    </ul>
  )
}

function KhungCho() {
  return (
    <div aria-busy="true" className="space-y-3">
      <p className="sr-only">Đang tải bản tổng hợp…</p>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  )
}

function NoiDung({ report }: { report: LifeSynthesisReport }) {
  const today = report.windowEnd
  const obsHoc = report.observations.filter((o) => o.domain === 'learning')
  const obsGhiChu = report.observations.filter((o) => o.domain === 'notes')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <section
          aria-labelledby="life-synthesis-learning"
          className="space-y-3 rounded-2xl border border-line-subtle bg-surface-base/60 p-3.5"
        >
          <h4
            id="life-synthesis-learning"
            className="flex items-center gap-2 text-sm font-bold text-content"
          >
            <GraduationCap
              aria-hidden="true"
              className="h-4 w-4 text-accent-300 theme-light:text-accent-800"
            />
            Học tập
          </h4>
          {report.learning.subjects.length > 0 && (
            <ul className="space-y-2">
              {report.learning.subjects.map((s) => (
                // Luôn xếp dọc (tên môn rồi mô tả): xếp ngang + xuống dòng tự do khiến môn tên dài
                // và môn tên ngắn ngắt khác nhau ở 390px (thấy ở ảnh chụp Tầng 8b).
                <li key={s.subjectId} className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-content">{s.label}</span>
                  <span className="text-sm text-content-secondary">{moTaMon(s, today)}</span>
                </li>
              ))}
            </ul>
          )}
          <DanhSachNhanXet items={obsHoc} />
        </section>

        <section
          aria-labelledby="life-synthesis-notes"
          className="space-y-3 rounded-2xl border border-line-subtle bg-surface-base/60 p-3.5"
        >
          <h4
            id="life-synthesis-notes"
            className="flex items-center gap-2 text-sm font-bold text-content"
          >
            <FolderKanban
              aria-hidden="true"
              className="h-4 w-4 text-accent-300 theme-light:text-accent-800"
            />
            Ghi chú
          </h4>
          {report.notes.openTasks > 0 && (
            <p className="text-sm text-content-secondary">
              <span className="font-semibold text-content">{report.notes.openTasks}</span> việc đang
              mở
            </p>
          )}
          <DanhSachNhanXet items={obsGhiChu} />
        </section>
      </div>

      {report.recommendations.length > 0 && (
        <section aria-labelledby="life-synthesis-recs" className="space-y-2">
          <h4
            id="life-synthesis-recs"
            className="flex items-center gap-2 text-sm font-bold text-content"
          >
            <Lightbulb
              aria-hidden="true"
              className="h-4 w-4 text-accent-300 theme-light:text-accent-800"
            />
            Gợi ý cho hôm nay
          </h4>
          <ul className="space-y-2">
            {report.recommendations.map((r) => (
              <li
                key={r.ruleId}
                className="flex flex-col gap-2 rounded-2xl border border-line-subtle p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm leading-relaxed text-content">{r.text}</p>
                <Link
                  to={duongDanDich(r.target)}
                  className={buttonClass({
                    variant: 'secondary',
                    size: 'sm',
                    className: 'tap-44 w-full shrink-0 sm:w-auto',
                  })}
                >
                  <span>{r.actionLabel}</span>
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default function LifeSynthesisDashboard() {
  const { state, retry } = useAsyncLoad(fetchLifeSynthesisReport, {
    errorMessage: 'Chưa tải được bản tổng hợp — thử lại sau.',
  })

  return (
    <section
      data-testid="life-synthesis"
      aria-labelledby={HEADING_ID}
      className="space-y-4 rounded-3xl border border-line-subtle bg-surface-card p-4 shadow-xl sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent-500/30 bg-accent-500/15 text-accent-300 theme-light:text-accent-800">
          <CalendarDays aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 id={HEADING_ID} className="text-base font-bold text-content">
            30 ngày qua của bạn
          </h3>
          <p className="text-sm text-content-secondary">
            {state.status === 'ready'
              ? `Đếm từ hoạt động đã lưu ở Học tập và Ghi chú, từ ${ngayNgan(state.data.windowStart)} đến hôm nay.`
              : 'Đếm từ hoạt động đã lưu ở Học tập và Ghi chú.'}
          </p>
        </div>
      </div>

      {state.status === 'loading' && <KhungCho />}
      {state.status === 'error' && (
        <LoadError
          message={state.message}
          onRetry={retry}
          hint="Bản tổng hợp chỉ đọc dữ liệu — không có gì bị thay đổi."
        />
      )}
      {state.status === 'ready' && <NoiDung report={state.data} />}
    </section>
  )
}
