// packages/core-contracts/subjectManifest.ts — Contract cho Multi-Subject Learning (V2-12).
// Phân tách shared learning primitives với subject-owned taxonomy, pedagogy & evaluation rules.
import { z } from 'zod'
import { versionedObject } from './version.js'
import { SUBJECT_MANIFEST_SCHEMA_VERSION } from './subjectManifestVersion.js'

export { SUBJECT_MANIFEST_SCHEMA_VERSION }

export const SubjectCategorySchema = z.enum(['language', 'stem', 'humanities'])

export const TaxonomyKindSchema = z.enum(['cefr', 'grade_curriculum', 'topic_hierarchy'])

export const EvaluationModeSchema = z.enum([
  'rubric_ielts',
  'rubric_ai',
  'step_analysis',
  'exact_formula',
  'discrete_check',
])

export const SubjectManifestSchema = versionedObject(
  {
    id: z.string().regex(/^[a-z_]+$/, 'id subject phải viết thường chữ cái và dấu gạch dưới'),
    label: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    category: SubjectCategorySchema,
    taxonomyKind: TaxonomyKindSchema,
    standardLevels: z.array(z.string().min(1).max(50)).min(1),
    questionTypes: z.array(z.string().min(1).max(50)).min(1),
    evaluationModes: z.array(EvaluationModeSchema).min(1),
    isDefault: z.boolean().optional(),
  },
  SUBJECT_MANIFEST_SCHEMA_VERSION,
)

export type SubjectManifest = z.infer<typeof SubjectManifestSchema>
