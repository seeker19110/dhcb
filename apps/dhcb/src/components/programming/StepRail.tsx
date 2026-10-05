// StepRail — bản DỌC của thanh bước bài học, dùng cho cột ngữ cảnh ở desktop.
//
// VÌ SAO TÁCH RIÊNG THAY VÌ CHO `StepBar` TỰ ĐỔI HƯỚNG: hai bố cục này khác nhau về thông tin
// hiển thị được, không chỉ khác hướng. Thanh ngang ở mobile phải cuộn ngang và chỉ đủ chỗ cho
// nhãn ngắn; cột dọc ở desktop có chỗ nêu rõ TÊN PHA ("nạp" / "luyện tập" / "hoàn tất") và số
// bước — đúng thứ giúp học viên biết mình đang ở đâu trong bài. Nhồi cả hai vào một component
// bằng cờ điều kiện sẽ tạo ra thứ khó đọc hơn hai file rõ ràng.
//
// BẤT BIẾN: trang gọi phải dựng ĐÚNG MỘT trong hai (StepBar hoặc StepRail) dựa trên
// `useIsDesktopViewport()`, KHÔNG dùng `lg:hidden` để ẩn cái còn lại — ẩn bằng CSS vẫn để cả
// hai trong DOM, làm trình đọc màn hình đọc danh sách bước hai lần và khiến Playwright báo
// strict-mode violation (bài học changelog `0199`).
//
// Giữ nguyên quy ước ngữ nghĩa của `StepBar`: vạch/tiêu đề ngăn pha KHÔNG dùng màu, vì màu đã
// mang nghĩa đạt/chưa đạt và một dấu hiệu không được mang hai nghĩa.
import { Check } from 'lucide-react'
import type { LessonStep } from './StepBar'

interface Props {
  steps: readonly LessonStep[]
  current: number
  isDone: (index: number) => boolean
  onGo: (index: number) => void
}

export default function StepRail({ steps, current, isDone, onGo }: Props) {
  const gradedTotal = steps.filter((s) => s.graded).length
  const gradedDone = steps.filter((s, i) => s.graded && isDone(i)).length

  return (
    <nav
      aria-label="Các bước bài học"
      className="rounded-2xl border border-line-subtle bg-surface-card p-4"
    >
      <div className="mb-3">
        <p className="t-label text-content">
          Bước {current + 1}/{steps.length}
        </p>
        <p className="t-caption text-content-muted mt-0.5">
          Đã đạt {gradedDone}/{gradedTotal} bài chấm
        </p>
      </div>

      <ol className="space-y-1">
        {steps.map((s, i) => {
          const active = i === current
          const done = s.graded ? isDone(i) : false
          // Nhãn cho trình đọc màn hình phải tự đủ nghĩa: dấu ✓ là hình, không đọc được.
          const status = s.graded ? (done ? ' — đã đạt' : ' — chưa đạt') : ''
          return (
            <li key={s.key}>
              {s.startsPhase && (
                <p
                  className="t-caption text-content-muted mt-3 mb-1 px-1"
                  role="separator"
                  aria-label={`Sang pha ${s.startsPhase}`}
                >
                  {s.startsPhase}
                </p>
              )}
              <button
                onClick={() => onGo(i)}
                aria-current={active ? 'step' : undefined}
                aria-label={`Bước ${i + 1}: ${s.label}${status}`}
                className={`tap-44-y flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                  active
                    ? 'bg-accent-500 text-black'
                    : done
                      ? 'bg-emerald-500/15 text-emerald-300 theme-light:text-emerald-800'
                      : 'text-content-secondary hover:bg-surface-raised hover:text-content'
                }`}
              >
                <span className="flex w-5 shrink-0 justify-center">
                  {done && !active ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <s.icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <span className="t-body-sm font-semibold">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
