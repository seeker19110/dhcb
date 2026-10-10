// packages/core-learner/subjectRegistry.ts — Subject Registry for Multi-Subject Learning.
// Supports English, Mathematics, Physics, Chemistry, Biology without forcing language concepts onto STEM.
import { SUBJECT_MANIFEST_SCHEMA_VERSION } from '@dhcb/core-contracts/subjectManifestVersion'
import type { SubjectManifest } from '@dhcb/core-contracts/subjectManifest'
import { NotFoundError } from '@dhcb/core-errors/appError'

// Hằng số tĩnh: KHÔNG `SubjectManifestSchema.parse` lúc chạy — kiểu `SubjectManifest[]` đã chặn field
// lạ/thiếu lúc biên dịch, còn ràng buộc giá trị (regex id, độ dài…) do subjectRegistry.test.ts kiểm
// bằng chính schema. Parse lúc chạy từng kéo zod (~37 KB) vào trang chủ của KHÁCH chỉ để xác nhận
// lại 6 hằng số viết tay (đo Lighthouse 2026-10-10, changelog đợt này).
export const SUPPORTED_SUBJECTS: SubjectManifest[] = [
  {
    id: 'english',
    label: 'Tiếng Anh',
    description: 'Luyện giao tiếp, ngữ pháp, phát âm và từ vựng tiếng Anh theo chuẩn CEFR quốc tế',
    category: 'language',
    taxonomyKind: 'cefr',
    standardLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    questionTypes: [
      'vocabulary_mcq',
      'fill_in_blank',
      'pronunciation_assessment',
      'dialogue_turn',
      'ielts_writing',
    ],
    evaluationModes: ['rubric_ielts', 'rubric_ai', 'discrete_check'],
    // [Slice 04] KHÔNG còn `isDefault: true` — nền tảng không ngầm định người dùng học Tiếng Anh
    // (docs/specs/2026-09-15-goc-hoc-tap-03-04-*.md). Field vẫn optional trong schema để tương thích.
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
  {
    id: 'mathematics',
    label: 'Toán học',
    description:
      'Đại số, hình học không gian, giải tích và xác suất thống kê theo chương trình chuẩn',
    category: 'stem',
    taxonomyKind: 'grade_curriculum',
    standardLevels: ['grade_10', 'grade_11', 'grade_12', 'university'],
    questionTypes: [
      'multiple_choice',
      'step_by_step_proof',
      'formula_calculation',
      'graphing_analysis',
    ],
    evaluationModes: ['exact_formula', 'step_analysis', 'discrete_check'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
  {
    id: 'physics',
    label: 'Vật lí',
    description: 'Cơ học, nhiệt học, điện từ học, quang học và vật lí lượng tử',
    category: 'stem',
    taxonomyKind: 'grade_curriculum',
    standardLevels: ['grade_10', 'grade_11', 'grade_12', 'university'],
    questionTypes: [
      'multiple_choice',
      'numerical_problem',
      'experiment_simulation',
      'formula_derivation',
    ],
    evaluationModes: ['exact_formula', 'step_analysis', 'discrete_check'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
  {
    id: 'chemistry',
    label: 'Hóa học',
    description: 'Hóa vô cơ, hóa hữu cơ, phản ứng oxi hóa khử và hóa phân tích',
    category: 'stem',
    taxonomyKind: 'grade_curriculum',
    standardLevels: ['grade_10', 'grade_11', 'grade_12', 'university'],
    questionTypes: [
      'chemical_equation',
      'reaction_mechanism',
      'stoichiometry_problem',
      'multiple_choice',
    ],
    evaluationModes: ['exact_formula', 'step_analysis', 'discrete_check'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
  {
    id: 'biology',
    label: 'Sinh học',
    description: 'Di truyền học, tiến hóa, sinh thái học, sinh học tế bào và vi sinh vật',
    category: 'stem',
    taxonomyKind: 'grade_curriculum',
    standardLevels: ['grade_10', 'grade_11', 'grade_12', 'university'],
    questionTypes: [
      'multiple_choice',
      'diagram_labeling',
      'genetics_cross_problem',
      'process_explanation',
    ],
    evaluationModes: ['step_analysis', 'rubric_ai', 'discrete_check'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
  {
    id: 'programming',
    label: 'Lập trình',
    description:
      'Học lập trình từ số 0 tới sản phẩm chạy thật: Python, JavaScript/TypeScript, SQL — thang bậc P1→P6, dự án xuyên suốt',
    category: 'stem',
    taxonomyKind: 'topic_hierarchy',
    standardLevels: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
    questionTypes: ['predict_output', 'parsons_ordering', 'code_writing', 'project_milestone'],
    evaluationModes: ['discrete_check', 'rubric_ai'],
    schemaVersion: SUBJECT_MANIFEST_SCHEMA_VERSION,
  },
]

const subjectMap = new Map<string, SubjectManifest>(SUPPORTED_SUBJECTS.map((s) => [s.id, s]))

/**
 * Gets a subject manifest by ID. Throws NotFoundError if not found.
 */
export function getSubjectManifest(subjectId: string): SubjectManifest {
  const manifest = subjectMap.get(subjectId.toLowerCase())
  if (!manifest) {
    throw new NotFoundError(`Không tìm thấy môn học "${subjectId}"`)
  }
  return manifest
}

/**
 * Lists all supported subjects.
 */
export function listSupportedSubjects(
  category?: 'language' | 'stem' | 'humanities',
): SubjectManifest[] {
  if (category) {
    return SUPPORTED_SUBJECTS.filter((s) => s.category === category)
  }
  return [...SUPPORTED_SUBJECTS]
}

/**
 * Validates if a level string is valid for a given subject.
 */
export function isValidSubjectLevel(subjectId: string, level: string): boolean {
  try {
    const manifest = getSubjectManifest(subjectId)
    return manifest.standardLevels.includes(level)
  } catch {
    return false
  }
}
