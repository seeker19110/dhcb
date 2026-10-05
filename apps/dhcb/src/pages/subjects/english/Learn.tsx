// ──────────────────────────────────────────────────────────────────────
// TRANG /learning-path — TỔNG QUAN LỘ TRÌNH CEFR (A1 → C2)
//
// Các tab học (Hôm nay · Ôn SRS · Từ khó · Kiểm tra) đã CHUYỂN vào trang
// riêng của từng cấp (/learning-path/a1…c2 — CefrLevelPage.tsx, nội dung
// tab ở components/StudyTabs.tsx). Trang này chỉ còn: mốc từ vựng + bản đồ
// 6 cấp (RoadmapTab) để chọn cấp muốn học.
// ──────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { duongDanMonTiengAnh } from '../../../lib/subjectsHost'
import { duongDanTuDien } from '../../../lib/englishRoutes'
import { Target } from 'lucide-react'
import { usePageTitle } from '../../../lib/usePageTitle'
import Layout from '../../../components/Layout'
import { PageShell } from '@core/PageShell'
import VocabMilestone from '../../../components/VocabMilestone'
import RoadmapTab from '../../../components/RoadmapTab'
import { getDirection } from '../../../lib/storage'
import { useAuth } from '../../../context/useAuth'

export default function Learn() {
  usePageTitle('Lộ trình học | Môn tiếng Anh · Đồng hành cùng bạn')
  const { user } = useAuth()
  const isA = getDirection() === 'A'

  if (!user) return null

  return (
    <div className="min-h-dvh bg-zinc-950">
      <Layout
        backTo={duongDanMonTiengAnh()}
        back
        title={isA ? 'Học theo lộ trình' : 'Learning Path'}
      />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Bản đồ lộ trình → width standard. */}
      <PageShell
        width="standard"
        baseWidth="max-w-3xl"
        className="!pb-[calc(1.5rem+var(--bnav-h))]"
      >
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          {isA ? 'Học theo lộ trình' : 'Learning Path'}
        </h1>
        <VocabMilestone userId={user.id} />

        {/* [2026-09-22, audit UI/UX P1-4] Bốn tab Hôm nay · Ôn SRS · Từ khó · Kiểm tra + phiên
            flashcard từng được dựng NGAY ĐÂY, y hệt phần đầu trang Từ điển — người vào "Học theo
            lộ trình" phải cuộn qua một màn hình flashcard mới thấy bản đồ bậc. Flashcard nay chỉ ở
            MỘT nơi (Từ điển); trang này giữ đúng việc của nó: mốc từ vựng + bản đồ 6 bậc. */}
        <Link
          to={duongDanTuDien()}
          className="tap-44 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200 hover:border-accent-500/50 hover:text-white transition"
        >
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-400 theme-light:text-accent-800" />
            {isA ? 'Ôn từ hôm nay · SRS · Từ khó · Kiểm tra' : 'Today · SRS · Hard words · Quiz'}
          </span>
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            {isA ? 'Mở Từ điển →' : 'Open Dictionary →'}
          </span>
        </Link>

        <RoadmapTab uid={user.id} isA={isA} />
      </PageShell>
    </div>
  )
}
