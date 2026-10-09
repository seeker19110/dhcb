import { NavigateFunction } from 'react-router-dom'
import ProactiveNudgeBanner from '../ProactiveAgent/ProactiveNudgeBanner'
import GoalAutoPilotCard from '../ProactiveAgent/GoalAutoPilotCard'
import NeuralMicroCurriculumCard from '../NeuralCurriculum/NeuralMicroCurriculumCard'
import WorkplaceHarvesterCard from '../CompanionVoice/WorkplaceHarvesterCard'
import A2ANegotiatorCard from '../CompanionVoice/A2ANegotiatorCard'
import ProactiveBriefingCard from '../ProactiveBriefingCard'
import AmbientScreenCopilot from '../CompanionVoice/AmbientScreenCopilot'
import NeuroAffectiveCard from '../CompanionVoice/NeuroAffectiveCard'
import ActionCanvasBanner from './ActionCanvasBanner'
import LifeSynthesisDashboard from '../LifeSynthesis/LifeSynthesisDashboard'
import type { ProactiveAgentState } from '@dhcb/core-contracts/proactiveAgent'

interface StudioProactiveProps {
  proactiveState: ProactiveAgentState | null
  navigate: NavigateFunction
}

export default function StudioProactive({ proactiveState, navigate }: StudioProactiveProps) {
  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {proactiveState?.nudges?.map((nudge) => (
        <ProactiveNudgeBanner
          key={nudge.id}
          nudge={nudge}
          onActionTriggered={(url) => navigate(url)}
        />
      ))}

      {proactiveState?.autoPilotPlans?.[0] && (
        <GoalAutoPilotCard
          plan={proactiveState.autoPilotPlans[0]}
          onActionClick={(url) => navigate(url)}
        />
      )}

      {/* "30 ngày qua của bạn" — bật lại sau changelog 0475, nay chỉ đếm bản ghi thật của Học tập +
          Ghi chú (changelog 0550). Đặt trước các thẻ thử nghiệm: đây là khối có dữ liệu thật. */}
      <LifeSynthesisDashboard />
      <NeuralMicroCurriculumCard />
      <WorkplaceHarvesterCard />
      <A2ANegotiatorCard />
      <ProactiveBriefingCard />
      <AmbientScreenCopilot />
      <NeuroAffectiveCard />
      {/* Dời từ studio "Tổng kết" đã gỡ (changelog 0475). Thẻ "Điều Phối Agent" (changelog 0481) và
          thẻ "Wearables" (changelog 0484) từng đứng trong studio này đã gỡ: chúng hiện kết quả
          dựng sẵn/số ngẫu nhiên như thể đã chạy thật. */}
      <ActionCanvasBanner navigate={navigate} />
    </div>
  )
}
