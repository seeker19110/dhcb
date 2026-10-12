// packages/core-personal/proactiveAgentService.ts — V5 Flagship Autonomous Proactive Agent Engine.
import type {
  GoalAutoPilotPlan,
  GoalAutoPilotStep,
  ProactiveAction,
  ProactiveAgentConfig,
  ProactiveAgentState,
  ProactiveNudge,
} from '@dhcb/core-contracts/proactiveAgent'
import type { PillarDomain } from '@dhcb/core-contracts/pillarDomain'

const defaultConfig: ProactiveAgentConfig = {
  nudgeFrequency: 'balanced',
  quietHoursStart: '22:30',
  quietHoursEnd: '06:30',
  autoFlowShieldEnabled: true,
  autoPilotEnabled: true,
}

// In-memory or fallback state cache
const stateCache = new Map<
  string,
  {
    config: ProactiveAgentConfig
    dismissedNudgeIds: Set<string>
    customPlans: GoalAutoPilotPlan[]
  }
>()

function getUserState(personId: string) {
  if (!stateCache.has(personId)) {
    stateCache.set(personId, {
      config: { ...defaultConfig },
      dismissedNudgeIds: new Set(),
      customPlans: [],
    })
  }
  return stateCache.get(personId)!
}

export interface ProactiveEvaluationContext {
  circadianEnergy?: number // 0-100 (e.g. from Wearables)
  stressIndex?: number // 0-100 (from Neuro-Affective)
  focusScore?: number // 0-100
  hasUnfinishedCanvasTask?: boolean
  streakCount?: number
  collocMasteryRatio?: number // 0-1
}

export function evaluateProactiveState(
  personId: string,
  context: ProactiveEvaluationContext = {},
): ProactiveAgentState {
  const userState = getUserState(personId)
  const now = new Date()
  const isoNow = now.toISOString()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000).toISOString()

  const nudges: ProactiveNudge[] = []

  // 1. Neuro-Affective Burnout prevention Check
  if (context.stressIndex && context.stressIndex > 75) {
    const nudgeId = `nudge-burnout-${personId}`
    if (!userState.dismissedNudgeIds.has(nudgeId)) {
      nudges.push({
        id: nudgeId,
        personId,
        nudgeType: 'neuro_burnout_prevention',
        priority: 'urgent',
        domain: 'general',
        title: 'Chỉ số căng thẳng tăng cao (Stress > 75%)',
        message:
          'Đồng Hành nhận thấy nhịp điệu làm việc đang căng thẳng. Hãy kích hoạt bài tập thở 2 phút hoặc nghỉ ngơi để bảo vệ dòng chảy.',
        suggestedAction: {
          id: 'act-breath',
          label: 'Nghỉ giải lao & Thở 2 phút',
          actionType: 'take_breathing_break',
          targetUrl: '/dong-hanh',
        },
        dismissed: false,
        expiresAt: oneHourLater,
        createdAt: isoNow,
      })
    }
  }

  // 2. Circadian Peak Learning Opportunity
  const energy = context.circadianEnergy ?? 85
  if (energy >= 80 && (!context.stressIndex || context.stressIndex <= 50)) {
    const nudgeId = `nudge-circadian-peak-${personId}`
    if (!userState.dismissedNudgeIds.has(nudgeId)) {
      nudges.push({
        id: nudgeId,
        personId,
        nudgeType: 'circadian_peak',
        priority: 'high',
        domain: 'learning',
        title: 'Khung Giờ Vàng Sinh Học (Peak Focus)',
        message:
          'Mức năng lượng nhận thức đang ở đỉnh cao (85%+). Thời điểm lý tưởng để ôn 1 mô-đun Collocations 2 phút!',
        suggestedAction: {
          id: 'act-micro-drill',
          label: 'Luyện 2 phút ngay',
          actionType: 'start_micro_drill',
          targetUrl: '/dong-hanh',
          payload: { autoStartDrill: true },
        },
        dismissed: false,
        expiresAt: oneHourLater,
        createdAt: isoNow,
      })
    }
  }

  // 3. Canvas Task Blocker Nudge
  if (context.hasUnfinishedCanvasTask) {
    const nudgeId = `nudge-canvas-${personId}`
    if (!userState.dismissedNudgeIds.has(nudgeId)) {
      nudges.push({
        id: nudgeId,
        personId,
        nudgeType: 'canvas_blocker',
        priority: 'medium',
        domain: 'work',
        title: 'Mục tiêu trên Action Canvas đang đợi',
        message: 'Bạn có 1 node mục tiêu trên bảng vẽ chưa hoàn thành. Nhấn để mở và xử lý nhanh.',
        suggestedAction: {
          id: 'act-open-canvas',
          label: 'Mở Action Canvas',
          actionType: 'open_canvas_task',
          targetUrl: '/workspace',
        },
        dismissed: false,
        expiresAt: oneHourLater,
        createdAt: isoNow,
      })
    }
  }

  // 4. Streak at risk Nudge
  if ((context.streakCount ?? 0) > 0) {
    const nudgeId = `nudge-streak-${personId}`
    if (!userState.dismissedNudgeIds.has(nudgeId) && nudges.length === 0) {
      nudges.push({
        id: nudgeId,
        personId,
        nudgeType: 'streak_at_risk',
        priority: 'medium',
        domain: 'learning',
        title: `Bảo vệ chuỗi Streak ${context.streakCount} ngày`,
        message:
          'Chỉ cần hoàn thành 1 bài luyện nói hoặc ôn 5 thẻ từ vựng để giữ chuỗi phong độ hôm nay.',
        suggestedAction: {
          id: 'act-srs-review',
          label: 'Ôn tập SRS',
          actionType: 'start_srs_review',
          targetUrl: '/dong-hanh',
        },
        dismissed: false,
        expiresAt: oneHourLater,
        createdAt: isoNow,
      })
    }
  }

  // Build Default Goal AutoPilot Plan if none exists
  let autoPilotPlans = userState.customPlans
  if (autoPilotPlans.length === 0) {
    const defaultPlan = generateGoalAutoPilotPlan(
      personId,
      'goal-sota-companion',
      'Làm chủ Giao tiếp Tiếng Anh Chuyên nghiệp & Đa Miền',
      'learning',
    )
    autoPilotPlans = [defaultPlan]
    userState.customPlans = autoPilotPlans
  }

  return {
    nudges,
    autoPilotPlans,
    config: userState.config,
    lastEvaluatedAt: isoNow,
  }
}

export function generateGoalAutoPilotPlan(
  personId: string,
  goalId: string,
  goalTitle: string,
  domain: PillarDomain = 'learning',
): GoalAutoPilotPlan {
  const now = new Date()
  const nextMilestone = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const defaultSteps: GoalAutoPilotStep[] = [
    {
      stepNumber: 1,
      title: 'Luyện 10 Collocations tinh hoa cấp độ C1',
      description: 'Làm chủ các cụm từ đắt giá và kiểm tra phản xạ điền từ',
      estimatedMinutes: 5,
      domain,
      status: 'completed',
      actionRoute: '/dong-hanh',
    },
    {
      stepNumber: 2,
      title: 'Luyện phản xạ Echo Shadowing nhịp điệu 0.4s',
      description: 'Khớp nối ngữ điệu chuẩn bản xứ và giảm độ lệch âm học F0',
      estimatedMinutes: 5,
      domain,
      status: 'in_progress',
      actionRoute: '/dong-hanh',
    },
    {
      stepNumber: 3,
      title: 'Giả lập Hội đồng Phỏng vấn / Pitching áp lực cao',
      description: 'Thực hành 1 kịch bản Holodeck 4 tiêu chí chấm điểm quốc tế',
      estimatedMinutes: 10,
      domain,
      status: 'pending',
      actionRoute: '/dong-hanh',
    },
    {
      stepNumber: 4,
      title: 'Đồng bộ hóa & Kiểm chứng kết quả trên Life Graph',
      description: 'Đánh giá chỉ số hiệu chuẩn quyết định và ghi nhận thành tựu',
      estimatedMinutes: 5,
      domain,
      status: 'pending',
      actionRoute: '/life-graph',
    },
  ]

  const completedSteps = defaultSteps.filter((s) => s.status === 'completed').length
  const progressPercentage = Math.round((completedSteps / defaultSteps.length) * 100)

  return {
    id: `autopilot-${goalId}`,
    personId,
    goalId,
    goalTitle,
    domain,
    progressPercentage,
    steps: defaultSteps,
    recommendedPacePerDay: 1,
    nextMilestoneDate: nextMilestone,
    updatedAt: now.toISOString(),
  }
}

export function dismissNudge(personId: string, nudgeId: string): boolean {
  const userState = getUserState(personId)
  userState.dismissedNudgeIds.add(nudgeId)
  return true
}

export function updateProactiveConfig(
  personId: string,
  newConfig: Partial<ProactiveAgentConfig>,
): ProactiveAgentConfig {
  const userState = getUserState(personId)
  userState.config = {
    ...userState.config,
    ...newConfig,
  }
  return userState.config
}

export function executeQuickAction(
  personId: string,
  nudgeId: string,
  action: ProactiveAction,
): { success: boolean; message: string; targetUrl: string } {
  dismissNudge(personId, nudgeId)
  return {
    success: true,
    message: `Đã kích hoạt hành động "${action.label}" thành công!`,
    targetUrl: action.targetUrl,
  }
}
