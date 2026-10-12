// packages/core-contracts/subconscious.ts — Hợp đồng dữ liệu cho Subconscious Engine V3.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'
import { PillarDomainSchema } from './pillarDomain.js'

export const SUBCONSCIOUS_SCHEMA_VERSION = 'v3.0.0'

export const PreComputedMorningStrategySchema = z
  .object({
    vitalTasks: z.array(z.string().min(1).max(300)).min(1).max(5),
    potentialObstacles: z.array(z.string().min(1).max(300)).max(5),
    recommendedMindset: z.string().min(1).max(500),
    targetDomainFocus: PillarDomainSchema,
  })
  .strict()

export type PreComputedMorningStrategy = z.infer<typeof PreComputedMorningStrategySchema>

export const SubconsciousHypothesisSchema = z
  .object({
    hypothesis: z.string().min(1).max(500),
    confidence: z.number().min(0).max(1),
    domain: z.string().min(1).max(100),
    evidenceCount: z.number().int().nonnegative(),
    actionProposed: z.string().min(1).max(500).optional(),
  })
  .strict()

export type SubconsciousHypothesis = z.infer<typeof SubconsciousHypothesisSchema>

export const SubconsciousThoughtLogSchema = z
  .object({
    id: UuidSchema,
    personId: UuidSchema,
    timestamp: IsoDateTimeSchema,
    cycleType: z.enum(['rem_consolidation', 'predictive_prep', 'spontaneous_insight']),
    triggerSource: z.string().min(1).max(100),
    hypothesesEvaluated: z.array(SubconsciousHypothesisSchema),
    graphChanges: z
      .object({
        nodesCreated: z.number().int().nonnegative(),
        edgesRewired: z.number().int().nonnegative(),
        redundantItemsPruned: z.number().int().nonnegative(),
      })
      .strict(),
    preComputedStrategy: PreComputedMorningStrategySchema,
    schemaVersion: z.literal(SUBCONSCIOUS_SCHEMA_VERSION),
  })
  .strict()

export type SubconsciousThoughtLog = z.infer<typeof SubconsciousThoughtLogSchema>
