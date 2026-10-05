// apps/dhcb/src/lib/subjectLabels.ts — MỘT bảng tra nhãn tiếng Việt cho giá trị enum của môn học.
// Giao diện KHÔNG được in thẳng mã enum ("rubric_ielts", "language"…) ra cho người học (audit
// 2026-09-30 M16). Thêm giá trị enum mới ở `@dhcb/core-contracts/subjectManifest` thì TS buộc
// bổ sung vào đây (kiểu Record đầy đủ khoá).
import type { SubjectManifest } from '@dhcb/core-contracts/subjectManifest'

type EvaluationMode = SubjectManifest['evaluationModes'][number]
type SubjectCategory = SubjectManifest['category']

const CATEGORY_LABELS: Record<SubjectCategory, string> = {
  language: 'Ngôn ngữ',
  stem: 'Khoa học',
  humanities: 'Nhân văn',
}

const EVALUATION_MODE_LABELS: Record<EvaluationMode, string> = {
  rubric_ielts: 'Chấm theo thang IELTS',
  rubric_ai: 'AI chấm theo tiêu chí',
  step_analysis: 'Kiểm từng bước giải',
  exact_formula: 'Đối chiếu công thức',
  discrete_check: 'Đúng/sai từng ý',
}

export function categoryLabel(category: SubjectCategory): string {
  return CATEGORY_LABELS[category]
}

export function evaluationModeLabel(mode: EvaluationMode): string {
  return EVALUATION_MODE_LABELS[mode]
}
