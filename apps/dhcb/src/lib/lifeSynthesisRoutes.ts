// lifeSynthesisRoutes.ts — đích khuyến nghị của "Tổng hợp 30 ngày" → URL trong app.
// Server chỉ trả LOẠI đích (môn / Góc học tập / Ghi chú); URL dựng qua đúng các hàm route dùng
// chung để đổi URL gốc chỉ cần sửa một chỗ (CLAUDE.md §7). Changelog 0550.
import type { SynthesisTarget } from '@dhcb/core-contracts/lifeSynthesis'
import { subjectsPath } from './subjectsHost'
import { duongDanGhiChu } from './domainRoutes'

export function duongDanDich(target: SynthesisTarget): string {
  switch (target.kind) {
    case 'subject':
      return subjectsPath(target.subjectId)
    case 'learning-hub':
      return subjectsPath()
    case 'notes':
      return duongDanGhiChu()
  }
}
