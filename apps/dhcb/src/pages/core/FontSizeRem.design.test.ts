// apps/dhcb/src/pages/core/FontSizeRem.design.test.ts — Cổng canh cỡ chữ theo tuỳ chọn người dùng
// (đợt U6 · M5, audit UI/UX 2026-09-30 mục 5 M5 + mục 11 điểm (f)).
//
// VÌ SAO CẦN: EN 301 549 v4.1.1 §9.7 / WCAG 1.4.4 — người dùng đổi cỡ chữ mặc định của trình duyệt
// (16→24px) thì chữ phải lớn theo. `font-size` viết bằng px KHOÁ cỡ chữ: audit đo được 87% nút chữ
// trang đọc truyện giữ nguyên cỡ vì `.read-body { font-size: 15px }`. Viết bằng rem
// (11px = 0.6875rem, 13px = 0.8125rem, 15px = 0.9375rem, 16px = 1rem) thì chữ theo cỡ người dùng.
//
// HAI LUẬT:
// 1. File CSS (apps/dhcb, apps/hub, packages): KHÔNG có `font-size: <số>px` nào — tuyệt đối.
//    Cần sàn px (vd chống iOS tự zoom ô nhập) thì dùng `max(1rem, 16px)`: không dưới 16px mà vẫn
//    lớn theo người dùng.
// 2. Mã TS/TSX: `text-[<số>px]` (Tailwind) và `fontSize: '<số>px'`/`fontSize: <số>` (style) là NỢ CŨ
//    (~500 chỗ, chủ yếu `text-[11px]`) — chuyển hàng loạt sang rem là việc cơ học, tách đợt riêng
//    để không xung đột với các đợt sửa giao diện song song. Test này là CHỐT CHẶN MỘT CHIỀU: mỗi
//    file chỉ được GIỮ NGUYÊN hoặc GIẢM số chỗ so với danh sách dưới; file mới phải là 0. Đã
//    chuyển sang rem ở file nào thì hạ số của file đó xuống (hoặc xoá dòng) cho chốt siết lại.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const REPO_ROOT = join(__dirname, '../../../../..')
const SCAN_ROOTS = ['apps/dhcb/src', 'apps/hub/src', 'packages']
const SKIP_DIRS = new Set(['node_modules', 'dist'])

/** `font-size: 15px` trong CSS — KHÔNG khớp `max(1rem, 16px)` (giá trị không bắt đầu bằng số). */
const CSS_PX_FONT_SIZE = /font-size\s*:\s*[\d.]+px/g
/** `text-[11px]` (Tailwind) · `fontSize: '11px'` · `fontSize: 11` (React hiểu số là px). */
const TS_PX_FONT_SIZE = /text-\[\d+(?:\.\d+)?px\]|fontSize:\s*(?:['"]\d+(?:\.\d+)?px['"]|\d)/g

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full, exts))
    else if (exts.includes(extname(entry))) out.push(full)
  }
  return out
}

function rel(full: string): string {
  return full
    .slice(REPO_ROOT.length + 1)
    .split('\\')
    .join('/')
}

function countMatches(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0
}

// Nợ cũ đo ngày 2026-10-05 (sau khi U6 đổi `.read-body`, ô nhập, CodeEditor, lịch hoạt động và avatar sang rem).
// `programming/LevelMilestones.tsx` là chữ SVG trong vòng tròn cỡ cố định — giữ px có chủ đích.
const LEGACY_PX_FONT_SIZE: Record<string, number> = {
  'apps/dhcb/src/components/ActionCanvas/CanvasAiOrchestratorModal.tsx': 1,
  'apps/dhcb/src/components/ActionCanvas/CanvasExportModal.tsx': 1,
  'apps/dhcb/src/components/ActionCanvas/InteractiveCanvasViewport.tsx': 4,
  'apps/dhcb/src/components/BottomNav.tsx': 1,
  'apps/dhcb/src/components/CefrExam.tsx': 1,
  'apps/dhcb/src/components/CefrLessonViews.tsx': 8,
  'apps/dhcb/src/components/Companion3D/AvatarEmbodimentSelector.tsx': 1,
  'apps/dhcb/src/components/CompanionStudios/ActionCanvasBanner.tsx': 1,
  'apps/dhcb/src/components/CompanionStudios/ChatProse.tsx': 3,
  'apps/dhcb/src/components/CompanionStudios/InteractiveQuestionCard.tsx': 3,
  'apps/dhcb/src/components/CompanionStudios/StudioDialogue.tsx': 6,
  'apps/dhcb/src/components/CompanionVoice/A2ANegotiatorCard.tsx': 10,
  'apps/dhcb/src/components/CompanionVoice/AmbientScreenCopilot.tsx': 8,
  'apps/dhcb/src/components/CompanionVoice/ArticulatoryPhoneticsVisualizer.tsx': 6,
  'apps/dhcb/src/components/CompanionVoice/EchoShadowingCard.tsx': 2,
  'apps/dhcb/src/components/CompanionVoice/NeuroAffectiveCard.tsx': 6,
  'apps/dhcb/src/components/CompanionVoice/ScenarioHolodeckCard.tsx': 12,
  'apps/dhcb/src/components/CompanionVoice/SocraticDiagnosticsCard.tsx': 3,
  'apps/dhcb/src/components/CompanionVoice/SubconsciousInsightsCard.tsx': 14,
  'apps/dhcb/src/components/CompanionVoice/WorkplaceHarvesterCard.tsx': 8,
  'apps/dhcb/src/components/DashboardEnglishDetails.tsx': 11,
  'apps/dhcb/src/components/DebateArena/DebateArenaCard.tsx': 2,
  'apps/dhcb/src/components/DebateArena/LiveDebateModal.tsx': 11,
  'apps/dhcb/src/components/DesktopSidebar.tsx': 1,
  'apps/dhcb/src/components/DetailedPronunciationCheck.tsx': 3,
  'apps/dhcb/src/components/EdgeAi/EdgeAiIndicator.tsx': 3,
  'apps/dhcb/src/components/ExamQuestionCard.tsx': 2,
  'apps/dhcb/src/components/FeedbackModal.tsx': 2,
  'apps/dhcb/src/components/Field.tsx': 1,
  'apps/dhcb/src/components/Home/HomeUniversalAiBar.tsx': 2,
  'apps/dhcb/src/components/KaraokeText.tsx': 1,
  'apps/dhcb/src/components/Layout.tsx': 2,
  'apps/dhcb/src/components/LeagueSection.tsx': 1,
  'apps/dhcb/src/components/LifeSynthesis/LifeSynthesisDashboard.tsx': 10,
  'apps/dhcb/src/components/LifeSynthesis/LifeSynthesisDetailModal.tsx': 9,
  'apps/dhcb/src/components/MemoryPalace/MemoryPalaceCard.tsx': 1,
  'apps/dhcb/src/components/MemoryPalace/MemoryPalaceExplorerModal.tsx': 8,
  'apps/dhcb/src/components/MeshTelemetry/MeshHealthMonitorModal.tsx': 8,
  'apps/dhcb/src/components/MeshTelemetry/RealtimeTelemetryBar.tsx': 1,
  'apps/dhcb/src/components/MetacognitiveReflection/MetacognitiveJournalCard.tsx': 2,
  'apps/dhcb/src/components/MetacognitiveReflection/MetacognitiveReflectionModal.tsx': 2,
  'apps/dhcb/src/components/NeuralCurriculum/CollocationGraphExplorer.tsx': 6,
  'apps/dhcb/src/components/NeuralCurriculum/MicroDrillModal.tsx': 1,
  'apps/dhcb/src/components/NeuralCurriculum/NeuralMicroCurriculumCard.tsx': 4,
  'apps/dhcb/src/components/PathStageQuiz.tsx': 1,
  'apps/dhcb/src/components/ProactiveAgent/GoalAutoPilotCard.tsx': 5,
  'apps/dhcb/src/components/ProactiveAgent/ProactiveNudgeBanner.tsx': 1,
  'apps/dhcb/src/components/PvPArena/PvPArenaCard.tsx': 2,
  'apps/dhcb/src/components/PvPArena/PvPArenaLobbyModal.tsx': 5,
  'apps/dhcb/src/components/PvPArena/PvPBattlefieldModal.tsx': 6,
  'apps/dhcb/src/components/QuickActions.tsx': 5,
  'apps/dhcb/src/components/QuizOptionKey.tsx': 1,
  'apps/dhcb/src/components/RateToggle.tsx': 1,
  'apps/dhcb/src/components/RoadmapTab.tsx': 3,
  'apps/dhcb/src/components/ShareProgress.tsx': 1,
  'apps/dhcb/src/components/StemScratchpad/StemScratchpadCard.tsx': 2,
  'apps/dhcb/src/components/StemScratchpad/StemScratchpadModal.tsx': 3,
  'apps/dhcb/src/components/StoryCard.tsx': 3,
  'apps/dhcb/src/components/StreakCelebration.tsx': 2,
  'apps/dhcb/src/components/UpgradeSection.tsx': 1,
  'apps/dhcb/src/components/VocabMilestone.tsx': 1,
  'apps/dhcb/src/components/VoicePicker.tsx': 1,
  'apps/dhcb/src/components/VoiceRoleBadge.tsx': 2,
  'apps/dhcb/src/components/WeeklyGoalCelebration.tsx': 2,
  'apps/dhcb/src/components/WordFormsBlock.tsx': 7,
  'apps/dhcb/src/components/admin/AdminFeatureStatusPanel.tsx': 4,
  'apps/dhcb/src/components/admin/AdminFeedbackPanel.tsx': 10,
  'apps/dhcb/src/components/admin/AdminPaymentsPanel.tsx': 11,
  'apps/dhcb/src/components/admin/AdminSystemControlPanel.tsx': 2,
  'apps/dhcb/src/components/admin/AdminUsagePanel.tsx': 3,
  'apps/dhcb/src/components/admin/AdminVipWhitelistPanel.tsx': 1,
  'apps/dhcb/src/components/chat/ChatList.tsx': 2,
  'apps/dhcb/src/components/chat/ChatWindow.tsx': 6,
  'apps/dhcb/src/components/chat/MessageBubble.tsx': 4,
  'apps/dhcb/src/components/location/GroupSpread.tsx': 1,
  'apps/dhcb/src/components/location/TripSetup.tsx': 2,
  'apps/dhcb/src/components/programming/LangBadge.tsx': 1,
  'apps/dhcb/src/components/programming/LessonProse.tsx': 1,
  'apps/dhcb/src/components/programming/LevelMilestones.tsx': 6,
  'apps/dhcb/src/components/studyTabs/QuizTab.tsx': 1,
  'apps/dhcb/src/components/studyTabs/TodayLesson.tsx': 5,
  'apps/dhcb/src/pages/companion/ActionCanvas.tsx': 1,
  'apps/dhcb/src/pages/companion/Companion.tsx': 4,
  'apps/dhcb/src/pages/core/About.tsx': 1,
  'apps/dhcb/src/pages/core/MistakeBank.tsx': 11,
  'apps/dhcb/src/pages/core/Onboarding.tsx': 6,
  'apps/dhcb/src/pages/core/Profile.tsx': 8,
  'apps/dhcb/src/pages/domains/notes/Notes.tsx': 3,
  'apps/dhcb/src/pages/domains/notes/NotesKanban.tsx': 3,
  'apps/dhcb/src/pages/learning/Practice.tsx': 27,
  'apps/dhcb/src/pages/learning/SubjectDetail.tsx': 3,
  'apps/dhcb/src/pages/learning/Subjects.tsx': 4,
  'apps/dhcb/src/pages/learning/appliedKnowledge/simulators/BrakingDistance.tsx': 1,
  'apps/dhcb/src/pages/learning/appliedKnowledge/simulators/CompoundInterest.tsx': 2,
  'apps/dhcb/src/pages/learning/appliedKnowledge/simulators/LoanAmortization.tsx': 2,
  'apps/dhcb/src/pages/learning/appliedKnowledge/simulators/PhScale.tsx': 3,
  'apps/dhcb/src/pages/learning/appliedKnowledge/simulators/ProfitOptimization.tsx': 2,
  'apps/dhcb/src/pages/learning/appliedKnowledge/simulators/TdeeMacro.tsx': 9,
  'apps/dhcb/src/pages/learning/appliedKnowledge/tabs/CapstoneProjects.tsx': 1,
  'apps/dhcb/src/pages/learning/appliedKnowledge/tabs/KnowledgeLibrary.tsx': 2,
  'apps/dhcb/src/pages/learning/appliedKnowledge/tabs/SimulatorsLab.tsx': 10,
  'apps/dhcb/src/pages/learning/practice/ReverseInterview.tsx': 1,
  'apps/dhcb/src/pages/subjects/english/CefrLevelPage.tsx': 3,
  'apps/dhcb/src/pages/subjects/english/Challenge.tsx': 4,
  'apps/dhcb/src/pages/subjects/english/Chat.tsx': 4,
  'apps/dhcb/src/pages/subjects/english/CommonPhrases.tsx': 2,
  'apps/dhcb/src/pages/subjects/english/Dictionary.tsx': 12,
  'apps/dhcb/src/pages/subjects/english/EnglishHome.tsx': 10,
  'apps/dhcb/src/pages/subjects/english/EnglishSettings.tsx': 2,
  'apps/dhcb/src/pages/subjects/english/Listening.tsx': 5,
  'apps/dhcb/src/pages/subjects/english/Speaking.tsx': 4,
  'apps/dhcb/src/pages/subjects/english/StoryReader.tsx': 2,
  'apps/dhcb/src/pages/subjects/english/Writing.tsx': 1,
  'apps/dhcb/src/pages/subjects/english/lessons/InlinePronounce.tsx': 5,
  'apps/dhcb/src/pages/subjects/english/lessons/LessonList.tsx': 2,
  'apps/dhcb/src/pages/subjects/english/lessons/LessonView.tsx': 3,
  'apps/dhcb/src/pages/subjects/english/lessons/RolePlayToolbar.tsx': 1,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingAbout.tsx': 1,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingCoursePage.tsx': 3,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingHome.tsx': 2,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingLessonPage.tsx': 1,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingLevelPage.tsx': 2,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingPathPage.tsx': 6,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingPathStagePage.tsx': 1,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingSpecializationPage.tsx': 3,
  'apps/dhcb/src/pages/subjects/programming/ProgrammingSpecializations.tsx': 3,
  'apps/hub/src/App.tsx': 7,
}
const LEGACY_TOTAL = 501

describe('Cỡ chữ theo tuỳ chọn người dùng — không khoá px (U6 · M5)', () => {
  const cssFiles = SCAN_ROOTS.flatMap((r) => walk(join(REPO_ROOT, r), ['.css']))
  const tsFiles = SCAN_ROOTS.flatMap((r) => walk(join(REPO_ROOT, r), ['.ts', '.tsx'])).filter(
    (f) => !/\.test\.tsx?$/.test(f) && !f.endsWith('.d.ts'),
  )

  it('hàm quét thấy đủ file (chống quét rỗng rồi xanh giả)', () => {
    expect(cssFiles.map(rel)).toContain('apps/dhcb/src/index.css')
    expect(tsFiles.length).toBeGreaterThan(500)
  })

  it('không file CSS nào còn `font-size: <số>px`', () => {
    const offenders = cssFiles
      .map((f) => [rel(f), countMatches(readFileSync(f, 'utf8'), CSS_PX_FONT_SIZE)] as const)
      .filter(([, n]) => n > 0)
    expect(offenders, 'đổi sang rem; cần sàn px thì dùng max(1rem, <số>px)').toEqual([])
  })

  it('mã TS/TSX: không file nào THÊM cỡ chữ px so với nợ cũ; file mới phải là 0', () => {
    const grown: string[] = []
    let total = 0
    for (const f of tsFiles) {
      const n = countMatches(readFileSync(f, 'utf8'), TS_PX_FONT_SIZE)
      total += n
      const allowed = LEGACY_PX_FONT_SIZE[rel(f)] ?? 0
      if (n > allowed) grown.push(`${rel(f)}: ${n} > ${allowed}`)
    }
    expect(
      grown,
      'dùng rem: text-[0.6875rem] thay text-[11px], text-[0.9375rem] thay text-[15px]',
    ).toEqual([])
    expect(total).toBeLessThanOrEqual(LEGACY_TOTAL)
  })

  it('CA GIẢ — mẫu regex bắt đúng ca px và tha ca rem/max()', () => {
    expect(countMatches('.a { font-size: 15px; }', CSS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('.a { font-size:12.5px }', CSS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('.a { font-size: 0.9375rem; }', CSS_PX_FONT_SIZE)).toBe(0)
    expect(countMatches('input { font-size: max(1rem, 16px) !important; }', CSS_PX_FONT_SIZE)).toBe(
      0,
    )
    expect(countMatches('className="text-[11px] font-bold"', TS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches("style={{ fontSize: '11px' }}", TS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('style={{ fontSize: 12 }}', TS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('className="text-[0.6875rem]"', TS_PX_FONT_SIZE)).toBe(0)
    expect(countMatches("fontSize: '1rem'", TS_PX_FONT_SIZE)).toBe(0)
  })
})
