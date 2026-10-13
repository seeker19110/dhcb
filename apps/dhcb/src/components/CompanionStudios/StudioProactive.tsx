import { NavigateFunction } from 'react-router-dom'
import NeuralMicroCurriculumCard from '../NeuralCurriculum/NeuralMicroCurriculumCard'
import WorkplaceHarvesterCard from '../CompanionVoice/WorkplaceHarvesterCard'
import A2ANegotiatorCard from '../CompanionVoice/A2ANegotiatorCard'
import AmbientScreenCopilot from '../CompanionVoice/AmbientScreenCopilot'
import NeuroAffectiveCard from '../CompanionVoice/NeuroAffectiveCard'
import ActionCanvasBanner from './ActionCanvasBanner'
import CompanionDailyCards from './CompanionDailyCards'
import LifeSynthesisDashboard from '../LifeSynthesis/LifeSynthesisDashboard'

interface StudioProactiveProps {
  navigate: NavigateFunction
}

export default function StudioProactive({ navigate }: StudioProactiveProps) {
  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* "Thẻ hôm nay" (GĐ4a, changelog 0629) thay nhắc nhở + lộ trình AutoPilot GIẢ LẬP cũ
          ("năng lượng 85%" cho mọi người, 4 bước gõ sẵn) và bản tin trùng ý `ProactiveBriefingCard`
          (bản tin ở Trang chủ vẫn giữ). */}
      <CompanionDailyCards />

      <NeuralMicroCurriculumCard />
      <WorkplaceHarvesterCard />
      {/* "30 ngày qua của bạn" — bật lại sau changelog 0475, nay chỉ đếm bản ghi thật của Học tập +
          Ghi chú (changelog 0550). Đứng SAU thẻ Workplace Harvester: cổng E2E [S06d]
          (`e2e/a11y.spec.ts`) đòi tab "Thẻ SRS" của thẻ đó nằm trong màn hình đầu ở 390 px — khối
          tổng hợp đặt trên sẽ đẩy nó xuống dưới nếp gấp. */}
      <LifeSynthesisDashboard />
      <A2ANegotiatorCard />
      <AmbientScreenCopilot />
      <NeuroAffectiveCard />
      {/* Dời từ studio "Tổng kết" đã gỡ (changelog 0475). Thẻ "Điều Phối Agent" (changelog 0481) và
          thẻ "Wearables" (changelog 0484) từng đứng trong studio này đã gỡ: chúng hiện kết quả
          dựng sẵn/số ngẫu nhiên như thể đã chạy thật. */}
      <ActionCanvasBanner navigate={navigate} />
    </div>
  )
}
