// packages/core-contracts/echoShadowing.ts — Hợp đồng dữ liệu bài mẫu cho bài luyện nói đuổi.
// Changelog 0484: bỏ `ShadowingSessionSchema`/`AcousticDriftSampleSchema` — kết quả "chấm" cũ tính
// từ số ngẫu nhiên, không đo gì.
import { z } from 'zod'

export const SHADOWING_SCHEMA_VERSION = 'v3.0.0'

export const ShadowingDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'native_fast',
])

export type ShadowingDifficulty = z.infer<typeof ShadowingDifficultySchema>

export const ShadowingPassageSchema = z
  .object({
    id: z.string().min(1).max(50),
    title: z.string().min(1).max(200),
    targetText: z.string().min(1).max(1000),
    speakerAccent: z.enum(['us_standard', 'uk_rp', 'australian']),
    audioUrl: z.string().min(1).max(300),
    bpmPacing: z.number().int().positive(),
    syllableCount: z.number().int().positive(),
    difficulty: ShadowingDifficultySchema,
    schemaVersion: z.literal(SHADOWING_SCHEMA_VERSION),
  })
  .strict()

export type ShadowingPassage = z.infer<typeof ShadowingPassageSchema>
