// packages/core-contracts/ambientContext.ts — Hợp đồng dữ liệu cho Ambient Vision & Screen Grounding V3.
import { z } from 'zod'
import { IsoDateTimeSchema } from './shared.js'
import { PillarDomainSchema } from './pillarDomain.js'

export const AMBIENT_SCHEMA_VERSION = 'v3.0.0'

export const AppTypeSchema = z.enum([
  'browser',
  'code_editor',
  'document_editor',
  'presentation',
  'chat_app',
  'general_desktop',
])

export type AppType = z.infer<typeof AppTypeSchema>

export const AmbientScreenCaptureSchema = z
  .object({
    timestamp: IsoDateTimeSchema,
    imageDataBase64: z.string().min(1),
    detectedAppType: AppTypeSchema.optional(),
    activeWindowHint: z.string().max(200).optional(),
    domainContext: PillarDomainSchema.default('general'),
  })
  .strict()

export type AmbientScreenCapture = z.infer<typeof AmbientScreenCaptureSchema>

export const ContextTipSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(1000),
    type: z.enum([
      'vocabulary',
      'grammar_fix',
      'code_refactor',
      'concept_explainer',
      'productivity',
    ]),
    relevanceScore: z.number().min(0).max(1),
    actionPayload: z.string().max(1000).optional(),
  })
  .strict()

export type ContextTip = z.infer<typeof ContextTipSchema>

export const AmbientContextInsightSchema = z
  .object({
    timestamp: IsoDateTimeSchema,
    detectedApp: AppTypeSchema,
    summaryOfWork: z.string().min(1).max(1000),
    relevantDomain: PillarDomainSchema,
    tips: z.array(ContextTipSchema).max(5),
    extractedKeywords: z.array(z.string().min(1).max(100)).max(10),
    schemaVersion: z.literal(AMBIENT_SCHEMA_VERSION),
  })
  .strict()

export type AmbientContextInsight = z.infer<typeof AmbientContextInsightSchema>
