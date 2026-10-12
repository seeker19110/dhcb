// packages/core-contracts/proactiveAgent.ts — V5 Flagship Autonomous Proactive Agent Contracts.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'
import { PillarDomainSchema } from './pillarDomain.js'

export const ProactiveNudgeTypeSchema = z.enum([
  'circadian_peak',
  'canvas_blocker',
  'goal_deadline_approaching',
  'streak_at_risk',
  'neuro_burnout_prevention',
  'collocation_mastery',
])
export type ProactiveNudgeType = z.infer<typeof ProactiveNudgeTypeSchema>

export const ProactiveNudgePrioritySchema = z.enum(['urgent', 'high', 'medium', 'low'])
export type ProactiveNudgePriority = z.infer<typeof ProactiveNudgePrioritySchema>

export const ProactiveActionTypeSchema = z.enum([
  'start_micro_drill',
  'open_canvas_task',
  'start_srs_review',
  'activate_flow_shield',
  'take_breathing_break',
  'custom_action',
])
export type ProactiveActionType = z.infer<typeof ProactiveActionTypeSchema>

export const ProactiveActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  actionType: ProactiveActionTypeSchema,
  targetUrl: z.string().min(1).max(200),
  payload: z.record(z.string(), z.unknown()).optional(),
})
export type ProactiveAction = z.infer<typeof ProactiveActionSchema>

export const ProactiveNudgeSchema = z.object({
  id: z.string().min(1),
  personId: UuidSchema,
  nudgeType: ProactiveNudgeTypeSchema,
  priority: ProactiveNudgePrioritySchema,
  domain: PillarDomainSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  suggestedAction: ProactiveActionSchema.optional(),
  dismissed: z.boolean(),
  expiresAt: IsoDateTimeSchema,
  createdAt: IsoDateTimeSchema,
})
export type ProactiveNudge = z.infer<typeof ProactiveNudgeSchema>

export const GoalAutoPilotStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  estimatedMinutes: z.number().int().min(1).max(180),
  domain: PillarDomainSchema,
  status: z.enum(['pending', 'in_progress', 'completed']),
  actionRoute: z.string().min(1).max(200),
})
export type GoalAutoPilotStep = z.infer<typeof GoalAutoPilotStepSchema>

export const GoalAutoPilotPlanSchema = z.object({
  id: z.string().min(1),
  personId: UuidSchema,
  goalId: z.string().min(1),
  goalTitle: z.string().min(1).max(200),
  domain: PillarDomainSchema,
  progressPercentage: z.number().min(0).max(100),
  steps: z.array(GoalAutoPilotStepSchema),
  recommendedPacePerDay: z.number().min(1).max(10),
  nextMilestoneDate: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
})
export type GoalAutoPilotPlan = z.infer<typeof GoalAutoPilotPlanSchema>

export const ProactiveAgentConfigSchema = z.object({
  nudgeFrequency: z.enum(['gentle', 'balanced', 'high_focus']),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/),
  autoFlowShieldEnabled: z.boolean(),
  autoPilotEnabled: z.boolean(),
})
export type ProactiveAgentConfig = z.infer<typeof ProactiveAgentConfigSchema>

export const ProactiveAgentStateSchema = z.object({
  nudges: z.array(ProactiveNudgeSchema),
  autoPilotPlans: z.array(GoalAutoPilotPlanSchema),
  config: ProactiveAgentConfigSchema,
  lastEvaluatedAt: IsoDateTimeSchema,
})
export type ProactiveAgentState = z.infer<typeof ProactiveAgentStateSchema>
