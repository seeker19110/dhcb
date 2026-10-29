// Nhãn tiếng Việt cho mức ưu tiên việc và trạng thái dự án — dùng chung cho Notes.tsx và NotesKanban.tsx
// (changelog 0690: Notes.tsx từng in thẳng giá trị enum "high"/"active" ra giao diện).
import type { WorkProject, WorkTask } from '@dhcb/core-contracts/work'

export const WORK_TASK_PRIORITY_LABEL: Record<WorkTask['priority'], string> = {
  urgent: 'Khẩn cấp',
  high: 'Cao',
  medium: 'Vừa',
  low: 'Thấp',
}

export const WORK_PROJECT_STATUS_LABEL: Record<WorkProject['status'], string> = {
  active: 'Đang làm',
  completed: 'Hoàn thành',
  archived: 'Lưu trữ',
}
