import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import StudioLoadingSkeleton from './StudioLoadingSkeleton'
import StudioCognitive from './StudioCognitive'
import StudioLabs from './StudioLabs'
import StudioProactive from './StudioProactive'
import { STUDIO_TABS_CONFIG } from './studioTypes'

// Mock sub-components
vi.mock('../MetacognitiveReflection/MetacognitiveJournalCard.js', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'meta-card' }, 'MetacognitiveJournalCard'),
}))
vi.mock('../MemoryPalace/MemoryPalaceCard.js', () => ({
  default: () => React.createElement('div', { 'data-testid': 'palace-card' }, 'MemoryPalaceCard'),
}))
vi.mock('../CompanionVoice/SubconsciousInsightsCard.js', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'subconscious-card' }, 'SubconsciousInsightsCard'),
}))
vi.mock('../CompanionVoice/SocraticDiagnosticsCard.js', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'socratic-card' }, 'SocraticDiagnosticsCard'),
}))
vi.mock('../DebateArena/DebateArenaCard.js', () => ({
  default: () => React.createElement('div', { 'data-testid': 'debate-card' }, 'DebateArenaCard'),
}))
vi.mock('../StemScratchpad/StemScratchpadCard.js', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'scratchpad-card' }, 'StemScratchpadCard'),
}))
vi.mock('../CompanionVoice/ArticulatoryPhoneticsVisualizer.js', () => ({
  default: () =>
    React.createElement(
      'div',
      { 'data-testid': 'articulatory-card' },
      'ArticulatoryPhoneticsVisualizer',
    ),
}))
vi.mock('../CompanionVoice/PronunciationHintsCard.js', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'pronunciation-hints' }, 'PronunciationHintsCard'),
}))
vi.mock('../CompanionVoice/EchoShadowingCard.js', () => ({
  default: () => React.createElement('div', { 'data-testid': 'echo-card' }, 'EchoShadowingCard'),
}))
vi.mock('../CompanionVoice/ScenarioHolodeckCard.js', () => ({
  default: () =>
    React.createElement('div', { 'data-testid': 'holodeck-card' }, 'ScenarioHolodeckCard'),
}))

vi.mock('../NeuralCurriculum/NeuralMicroCurriculumCard', () => ({
  default: () => React.createElement('div', { 'data-testid': 'neural-card' }),
}))
vi.mock('../CompanionVoice/WorkplaceHarvesterCard', () => ({
  default: () => React.createElement('div', { 'data-testid': 'harvester-card' }),
}))
vi.mock('../CompanionVoice/A2ANegotiatorCard', () => ({
  default: () => React.createElement('div', { 'data-testid': 'a2a-card' }),
}))
vi.mock('../ProactiveBriefingCard', () => ({
  default: () => React.createElement('div', { 'data-testid': 'briefing-card' }),
}))
vi.mock('../CompanionVoice/AmbientScreenCopilot', () => ({
  default: () => React.createElement('div', { 'data-testid': 'ambient-card' }),
}))
vi.mock('../CompanionVoice/NeuroAffectiveCard', () => ({
  default: () => React.createElement('div', { 'data-testid': 'neuro-card' }),
}))

describe('CompanionStudios', () => {
  it('renders StudioLoadingSkeleton with shimmering placeholders', () => {
    const html = renderToStaticMarkup(React.createElement(StudioLoadingSkeleton))
    expect(html).toContain('animate-shimmer')
  })

  it('renders StudioCognitive with all reflection and memory components', () => {
    const html = renderToStaticMarkup(React.createElement(StudioCognitive))
    expect(html).toContain('data-testid="meta-card"')
    expect(html).toContain('data-testid="palace-card"')
    expect(html).toContain('data-testid="subconscious-card"')
    expect(html).toContain('data-testid="socratic-card"')
  })

  it('renders StudioLabs with all debate and stem laboratory components', () => {
    const html = renderToStaticMarkup(React.createElement(StudioLabs))
    expect(html).toContain('data-testid="debate-card"')
    expect(html).toContain('data-testid="scratchpad-card"')
    expect(html).toContain('data-testid="articulatory-card"')
    expect(html).toContain('data-testid="pronunciation-hints"')
    expect(html).toContain('data-testid="echo-card"')
    expect(html).toContain('data-testid="holodeck-card"')
  })

  // Changelog 0475: studio "Tổng kết" gỡ vì bảng "phân tích cuộc sống" hiển thị điểm bịa. Hai thứ
  // còn lại của nó (thẻ Agent, lối vào DUY NHẤT của Action Canvas) phải còn đường vào ở "Kế hoạch".
  it('không còn studio "Tổng kết"', () => {
    expect(STUDIO_TABS_CONFIG.map((t) => t.label)).not.toContain('Tổng kết')
    expect(STUDIO_TABS_CONFIG.map((t) => t.id as string)).not.toContain('synthesis')
  })

  // Changelog 0481: thẻ "Điều Phối Agent" gỡ vì hiện phiên agent DỰNG SẴN như đã chạy thật. Lối
  // vào DUY NHẤT của Action Canvas phải còn.
  it('StudioProactive không còn thẻ Agent, vẫn giữ lối vào Action Canvas', () => {
    const html = renderToStaticMarkup(
      React.createElement(StudioProactive, { proactiveState: null, navigate: vi.fn() }),
    )
    expect(html).not.toContain('Điều Phối Agent')
    expect(html).not.toContain('Khởi chạy Agent')
    expect(html).toContain('Action Canvas')
    expect(html).toContain('Mở Workspace')
  })
})
