import { describe, it, expect } from 'vitest'
import { categoryLabel, evaluationModeLabel } from './subjectLabels'

describe('subjectLabels — nhãn tiếng Việt cho enum môn học', () => {
  it('mọi nhãn là tiếng Việt, không chứa mã enum thô (gạch dưới / viết liền thường)', () => {
    const labels = [
      categoryLabel('language'),
      categoryLabel('stem'),
      categoryLabel('humanities'),
      evaluationModeLabel('rubric_ielts'),
      evaluationModeLabel('rubric_ai'),
      evaluationModeLabel('step_analysis'),
      evaluationModeLabel('exact_formula'),
      evaluationModeLabel('discrete_check'),
    ]
    for (const label of labels) {
      expect(label).not.toMatch(/_/)
      expect(label).toMatch(/^\p{Lu}/u) // viết hoa chữ đầu câu
    }
    // Mỗi giá trị enum một nhãn riêng — không hai chế độ chấm trùng chữ.
    expect(new Set(labels).size).toBe(labels.length)
  })
})
