// packages/core-contracts/proactiveBriefing.ts — V2 Flagship Proactive Briefing Contracts.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'

export const ProactiveBriefingTypeSchema = z.enum(['morning', 'evening'])
export type ProactiveBriefingType = z.infer<typeof ProactiveBriefingTypeSchema>

export const ProactiveBriefingPrioritySchema = z.enum(['urgent', 'high', 'normal'])
export type ProactiveBriefingPriority = z.infer<typeof ProactiveBriefingPrioritySchema>

// Trụ Career · Startup · Life đã gỡ 2026-09-20 — bản tin chỉ sinh mục cho trụ còn thật (changelog 0628).
export const ProactiveBriefingDomainSchema = z.enum(['learning', 'work', 'personal'])
export type ProactiveBriefingDomain = z.infer<typeof ProactiveBriefingDomainSchema>

export const ProactiveBriefingItemSchema = z.object({
  id: z.string().min(1),
  domain: ProactiveBriefingDomainSchema,
  title: z.string().min(1).max(200),
  action: z.string().min(1).max(300),
  route: z.string().min(1).max(200),
  priority: ProactiveBriefingPrioritySchema,
})
export type ProactiveBriefingItem = z.infer<typeof ProactiveBriefingItemSchema>

export const ProactiveBriefingSchema = z.object({
  id: z.string().min(1),
  personId: UuidSchema,
  type: ProactiveBriefingTypeSchema,
  greeting: z.string().min(1).max(500),
  summary: z.string().min(1).max(2000),
  actionItems: z.array(ProactiveBriefingItemSchema),
  insights: z.array(z.string().min(1)),
  generatedAt: IsoDateTimeSchema,
})
export type ProactiveBriefing = z.infer<typeof ProactiveBriefingSchema>

export const ProactiveBriefingRequestSchema = z.object({
  personId: UuidSchema,
  type: ProactiveBriefingTypeSchema.optional(),
  forceRegenerate: z.boolean().optional(),
})
export type ProactiveBriefingRequest = z.infer<typeof ProactiveBriefingRequestSchema>
