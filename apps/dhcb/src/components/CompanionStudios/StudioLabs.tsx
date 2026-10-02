import PvPArenaCard from '../PvPArena/PvPArenaCard.js'
import DebateArenaCard from '../DebateArena/DebateArenaCard.js'
import StemScratchpadCard from '../StemScratchpad/StemScratchpadCard.js'
import ArticulatoryPhoneticsVisualizer from '../CompanionVoice/ArticulatoryPhoneticsVisualizer.js'
import PronunciationHintsCard from '../CompanionVoice/PronunciationHintsCard.js'
import EchoShadowingCard from '../CompanionVoice/EchoShadowingCard.js'
import ScenarioHolodeckCard from '../CompanionVoice/ScenarioHolodeckCard.js'

export default function StudioLabs() {
  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      <PvPArenaCard />
      <DebateArenaCard />
      <StemScratchpadCard />
      <ArticulatoryPhoneticsVisualizer />
      <PronunciationHintsCard />
      <EchoShadowingCard />
      <ScenarioHolodeckCard />
    </div>
  )
}
