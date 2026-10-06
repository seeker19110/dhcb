// StemContinueBlock — khối "Học tiếp" của trang môn STEM (Toán · Lí · Hoá · Sinh).
//
// Dùng chung `ContinueCard` với trang môn Tiếng Anh + Lập trình (changelog 0471). Việc chọn bài
// nằm ở hàm thuần `pickStemContinue` (lib/stemContinue.ts); ở đây chỉ nối dữ liệu và vẽ.
//
// Ba trạng thái tiến độ (luật số 1: không nói "chưa học" khi chưa đo được):
//  - đang tải  → khối giữ chỗ, nút khoá, KHÔNG đoán tên bài;
//  - lỗi tải   → coi như chưa có bằng chứng, gợi ý bài đầu (không khẳng định đã học gì);
//  - sẵn sàng  → bài kế tiếp thật.
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContinueCard } from './ContinueCard'
import { useStemCompletionState } from '../../lib/useStemCompletionState'
import { duongDanBaiHoc, duongDanDanhSachBai, type StemSubject } from '../../lib/stemLessonRoutes'
import { pickStemContinue, type StemContinueLesson } from '../../lib/stemContinue'

export default function StemContinueBlock({ subject }: { subject: StemSubject }) {
  const nav = useNavigate()
  const tienDo = useStemCompletionState(subject.id)

  const pick = useMemo(() => {
    const theoLop = new Map<string, readonly StemContinueLesson[]>(
      subject.grades.map((g) => [g, subject.loader.listCoreByGrade(g)]),
    )
    return pickStemContinue(theoLop, tienDo.stateStatus === 'ready' ? tienDo.state : null)
  }, [subject, tienDo.state, tienDo.stateStatus])

  if (pick.kind === 'empty') return null

  if (pick.kind === 'all-done') {
    return (
      <ContinueCard
        eyebrow="Đã học xong"
        title={`Bạn đã hoàn thành mọi bài chuẩn môn ${subject.label}`}
        actionLabel="Xem lại danh sách bài"
        onAction={() => nav(duongDanDanhSachBai(subject.id))}
      />
    )
  }

  if (tienDo.stateStatus === 'loading') {
    return <ContinueCard eyebrow="Học tiếp" actionLabel="Học tiếp" onAction={() => {}} disabled />
  }

  const eyebrow = pick.resuming ? 'Đang học dở' : pick.fresh ? 'Bắt đầu' : 'Học tiếp'
  return (
    <ContinueCard
      eyebrow={eyebrow}
      title={pick.lesson.title}
      meta={<span className="text-xs font-semibold text-zinc-400">Lớp {pick.grade}</span>}
      actionLabel={pick.resuming ? 'Học tiếp' : pick.fresh ? 'Bắt đầu học' : 'Học bài này'}
      onAction={() => nav(duongDanBaiHoc(subject.id, pick.lesson.id, pick.lesson.title))}
    />
  )
}
