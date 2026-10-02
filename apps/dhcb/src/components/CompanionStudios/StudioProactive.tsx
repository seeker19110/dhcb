import { NavigateFunction } from 'react-router-dom'
import ProactiveNudgeBanner from '../ProactiveAgent/ProactiveNudgeBanner'
import GoalAutoPilotCard from '../ProactiveAgent/GoalAutoPilotCard'
import NeuralMicroCurriculumCard from '../NeuralCurriculum/NeuralMicroCurriculumCard'
import WorkplaceHarvesterCard from '../CompanionVoice/WorkplaceHarvesterCard'
import WearablesSyncCard from '../CompanionVoice/WearablesSyncCard'
import A2ANegotiatorCard from '../CompanionVoice/A2ANegotiatorCard'
import ProactiveBriefingCard from '../ProactiveBriefingCard'
import AmbientScreenCopilot from '../CompanionVoice/AmbientScreenCopilot'
import NeuroAffectiveCard from '../CompanionVoice/NeuroAffectiveCard'
import AgentOrchestratorCard from '../AgentOrchestrator/AgentOrchestratorCard'
import ActionCanvasBanner from './ActionCanvasBanner'
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

      <NeuralMicroCurriculumCard />
      <WorkplaceHarvesterCard />
      <WearablesSyncCard />
      <A2ANegotiatorCard />
      <ProactiveBriefingCard />
      <AmbientScreenCopilot />
      <NeuroAffectiveCard />
      {/* Dời từ studio "Tổng kết" đã gỡ (changelog 0475). */}
      <AgentOrchestratorCard />
      <ActionCanvasBanner navigate={navigate} />
    </div>
  )
}
