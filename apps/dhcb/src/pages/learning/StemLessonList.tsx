// StemLessonList — danh sách bài học của một môn STEM (Toán · Lí · Hoá · Sinh).
//
// MỘT trang dùng cho cả bốn môn: bốn môn chung một khuôn bài học nên chung luôn màn liệt kê.
// Trang chỉ đọc CHỈ MỤC NHẸ (`loader.index`), không nạp nội dung bài nào — nội dung chỉ tải
// khi người học mở đúng bài (xem StemLessonView).
import { useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { GraduationCap, Trophy } from 'lucide-react'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import { usePageTitle } from '../../lib/usePageTitle'
import { TomTatChuaDuyet } from '../../components/ChuaDuyetChuyenMon'
import { OutlineTreeLinked, LoiTienDo } from '../../components/OutlinePane'
import { getStemSubject } from '../../lib/stemLessonRoutes'
import { buildStemOutlineForApp, locNhanh } from '../../lib/outline/stemOutlineApp'
import { useStemCompletionState } from '../../lib/useStemCompletionState'

export default function StemLessonList() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const subject = getStemSubject(subjectId)
  const [grade, setGrade] = useState<string>(subject?.grades[0] ?? '10')
  const [nhanh, setNhanh] = useState<'core' | 'advanced'>('core')

  usePageTitle(subject ? `Bài học môn ${subject.label}` : 'Bài học')

  const baiCoBan = useMemo(
    () => (subject ? subject.loader.listCoreByGrade(grade) : []),
    [subject, grade],
  )
  const baiNangCao = useMemo(() => (subject ? subject.loader.listAdvanced() : []), [subject])
  // MỘT cây cho cả trang (S07-2, Q4): danh sách bài không còn là `<ol>` riêng của trang này
  // mà là đúng `OutlineTree` mà trang bài học dùng — một mã nguồn, một cách đánh dấu tiến độ.
  // [S11-3] Lớp tiến độ đọc từ bằng chứng hoàn thành. Cấu trúc cây vẫn dựng đồng bộ từ chỉ
  // mục nên danh sách có ngay; tiến độ đắp lên sau, và mọi lá là "Chưa đo được" cho tới khi
  // lớp đó tải xong — không bao giờ hiện "Chưa học" trong lúc còn đang tải.
  const tienDo = useStemCompletionState(subject?.id)
  const outline = useMemo(
    () => (subject ? buildStemOutlineForApp(subject, grade, tienDo) : undefined),
    [subject, grade, tienDo],
  )

  if (!subject) return <Navigate to="/goc-hoc-tap" replace />

  const cay = locNhanh(outline, subject.id, nhanh)
  const nhapCoBan = baiCoBan.filter((b) => b.reviewStatus === 'draft').length
  const nhapNangCao = baiNangCao.filter((b) => b.reviewStatus === 'draft').length

  return (
    <>
      {/* [2026-10-01] Đốt cuối = chính trang này → nút Back ghi "← {môn}" và về trang môn
          (trước đây ghi "← Góc học tập" mà bấm lại về Trang chủ). Không truyền `title`: tiêu đề
          đã là <h1> ngay dưới. */}
      <Layout crumbs={[{ label: `Bài học môn ${subject.label}`, to: '' }]} />
      <PageShell width="standard">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content">
          Bài học môn {subject.label}
        </h1>
        <p className="mt-2 text-content-secondary">
          {subject.loader.index.length} bài, gồm {baiNangCao.length} chuyên đề bồi dưỡng học sinh
          giỏi.
        </p>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Nhánh học">
          <button
            type="button"
            role="tab"
            aria-selected={nhanh === 'core'}
            onClick={() => setNhanh('core')}
            className={buttonClass({ variant: nhanh === 'core' ? 'primary' : 'ghost' })}
          >
            <GraduationCap className="inline h-4 w-4 mr-2" aria-hidden="true" />
            Chương trình chuẩn
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={nhanh === 'advanced'}
            onClick={() => setNhanh('advanced')}
            className={buttonClass({ variant: nhanh === 'advanced' ? 'primary' : 'ghost' })}
          >
            <Trophy className="inline h-4 w-4 mr-2" aria-hidden="true" />
            Bồi dưỡng học sinh giỏi
          </button>
        </div>

        {nhanh === 'core' ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Chọn lớp">
              {subject.grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grade === g}
                  onClick={() => setGrade(g)}
                  className={buttonClass({ variant: grade === g ? 'primary' : 'ghost' })}
                >
                  Lớp {g}
                </button>
              ))}
            </div>

            <TomTatChuaDuyet soChuaDuyet={nhapCoBan} tong={baiCoBan.length} />

            {cay === undefined ? (
              <p className="mt-8 text-content-secondary">
                Lớp {grade} của môn {subject.label} chưa có bài học nào. Hãy chọn lớp khác.
              </p>
            ) : (
              <div className="mt-6">
                <OutlineTreeLinked outline={cay} title={`Mục lục lớp ${grade}`} />
                {tienDo.stateStatus === 'error' && <LoiTienDo onRetry={tienDo.reload} />}
              </div>
            )}
          </>
        ) : cay === undefined ? (
          <p className="mt-8 text-content-secondary">
            Môn {subject.label} chưa có chuyên đề bồi dưỡng học sinh giỏi.
          </p>
        ) : (
          <>
            <TomTatChuaDuyet soChuaDuyet={nhapNangCao} tong={baiNangCao.length} />
            <div className="mt-6">
              <OutlineTreeLinked outline={cay} title="Mục lục chuyên đề bồi dưỡng" />
              {tienDo.stateStatus === 'error' && <LoiTienDo onRetry={tienDo.reload} />}
            </div>
          </>
        )}
      </PageShell>
    </>
  )
}
